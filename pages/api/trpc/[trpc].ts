import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { AudioFeatures } from "../../../types/audio-features";
import { Album, Artist, Playlist } from "../../../types/playlist";

var token: string | null = null;
var expAt: number = Date.now();

const getToken = async () => {
  if (token && expAt > Date.now()) {
    console.log("Using cached token");
    return token;
  }

  console.log("Fetching new token");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64"),
    },
    body: `grant_type=refresh_token&refresh_token=${process.env.REFRESH_TOKEN}`,
  });

  const responseBody = await res.json();

  token = responseBody.access_token;
  expAt = Date.now() + responseBody.expires_in * 1000;

  return responseBody.access_token;
};

const fetchCurrentlyPlayingTrack = async () => {
  const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });

  try {
    return await response.json();
  } catch (e) {
    return null;
  }
};

interface GetCurrentActivity {
  title: string;
  artists: string[];
  audioFeatures: AudioFeatures;
  url: string;
  isPlaying: boolean;
  image: string;
  progressMs: number;
  durationMs: number;
  contextType: string;
  contextTitle: string;
}

let cachedTrackId: string | null = null;
let cachedAudioFeatures: AudioFeatures | null = null;

const getAudioFeatures = async (trackId: string): Promise<AudioFeatures> => {
  if (cachedTrackId === trackId) {
    return cachedAudioFeatures!;
  }
  const response = await fetch("https://api.spotify.com/v1/audio-features?ids=" + trackId, {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });

  cachedAudioFeatures = ((await response.json()) as any).audio_features[0];
  return cachedAudioFeatures!;
};

// TODO: fix limit
const getPlaylists = async () => {
  const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });
  return await response.json();
};

const getPlaylist = async (id: string) => {
  const response = await fetch("https://api.spotify.com/v1/playlists/" + id, {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });
  return await response.json();
};

function sliceIntoChunks(arr: any[], chunkSize: number) {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    res.push(chunk);
  }
  return res;
}

const getArtists = (artistIds: string[]): Promise<Artist[]> =>
  fetchWithMultipleIds("https://api.spotify.com/v1/artists", artistIds);

const getAlbums = (albumsId: string[]): Promise<Album[]> =>
  fetchWithMultipleIds("https://api.spotify.com/v1/albums", albumsId);

const getAudioFeaturesBatch = (trackIds: string[]): Promise<AudioFeatures[]> =>
  fetchWithMultipleIds("https://api.spotify.com/v1/audio-features", trackIds);

// TODO: investigate the batch size per endpoint
const fetchWithMultipleIds = async <T>(url: string, ids: string[], batchSize: number = 20): Promise<T> => {
  const chunks = sliceIntoChunks(ids, batchSize);
  const fetches = await Promise.all(chunks.map((chunk) => fetchWithMultipleIdsDelegate<T>(url, chunk)));

  // wonderful peace of code, lets keep this between us
  return fetches
    .flatMap((f) => Object.values(f))
    .flat()
    .filter((i) => !!i) as unknown as T;
};

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  if (value === null || value === undefined) return false;
  const testDummy: TValue = value;
  return true;
}

const fetchWithMultipleIdsDelegate = async <T>(url: string, ids: string[]): Promise<T> => {
  const response = await fetch(url + "?ids=" + ids.join(","), {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });

  if (response.ok) {
    return await response.json();
  } else {
    console.error("Failed to fetch, response from spotify: " + (await response.text()));
    throw Error(`Failed to fetch: '${url}', ${response.status}`);
  }
};

const appRouter = trpc
  .router()
  .query("get-current-activity", {
    async resolve() {
      const body = await fetchCurrentlyPlayingTrack();

      if (!body) {
        return null;
      }

      const res: GetCurrentActivity = {
        title: body.item.name,
        url: body.item.external_urls.spotify,
        artists: body.item.artists.map((artist: any) => artist.name),
        audioFeatures: await getAudioFeatures(body.item.id),
        isPlaying: body.is_playing,
        image: body.item.album.images[0].url,
        progressMs: body.progress_ms,
        durationMs: body.item.duration_ms,
        contextType: body.context.type,
        contextTitle: body.item.album.name,
      };

      return res;
    },
  })
  .query("test", {
    async resolve() {
      return { test: "test" };
    },
  })
  .query("get-playlists", {
    async resolve() {
      return await getPlaylists();
    },
  })
  .query("playlist", {
    input: (val: unknown) => {
      if (typeof val === "string") return val;
      throw new Error(`Invalid input: ${typeof val}`);
    },
    async resolve(req) {
      const playlist: Playlist = await getPlaylist(req.input);

      const filteredTracks = playlist.tracks.items.filter((track) => notEmpty(track.track));

      const artistIds = filteredTracks.map((item) => item.track.artists[0].id);
      const albumIds = filteredTracks.map((item) => item.track.album.id);
      const songIds = filteredTracks.map((item) => item.track.id);

      const [artists, audioFeatures, albums] = await Promise.all([
        getArtists(artistIds),
        getAudioFeaturesBatch(songIds),
        getAlbums(albumIds),
      ]);

      console.log("Artists: " + artists);

      const response: Playlist = {
        ...playlist,
        tracks: {
          ...playlist.tracks,
          items: filteredTracks.map((item) => {
            const album = albums.find((album) => album.id === item.track.album.id);
            const artist = artists.find((artist: Artist) => artist.id === item.track.artists[0].id);
            const audioFeature = audioFeatures.find((audioFeatures) => audioFeatures.id === item.track.id)!;

            let genres = [];

            if ((album?.genres ?? [])?.length > 0) {
              genres = album!.genres;
            } else if ((artist?.genres ?? [])?.length > 0) {
              genres = artist!.genres;
            }

            return {
              ...item,
              track: {
                ...item.track,
                genres,
                audio_features: audioFeature,
              },
            };
          }),
        },
      };

      return response;
    },
  });

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
