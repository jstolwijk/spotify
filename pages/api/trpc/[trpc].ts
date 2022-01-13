import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { AudioFeatures } from "../../../types/audio-features";
import { Album, AlbumsResponse, Artist, Artist2, Playlist } from "../../../types/playlist";

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

  return await response.json();
};

interface GetCurrentActivity {
  title: string;
  artists: string[];
  audioFeatures: AudioFeatures;
  url: string;
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

const getArtists = async (artistIds: string[]): Promise<Artist[]> => {
  const chunks = sliceIntoChunks(artistIds, 50);
  const fetches = await Promise.all(chunks.map((chunk) => fetchArtists(chunk)));

  return fetches.flatMap((artists) => artists.artists);
};

const fetchArtists = async (artistIds: string[]) => {
  const response = await fetch("https://api.spotify.com/v1/artists?ids=" + artistIds.join(","), {
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

const getAlbums = async (albumsId: string[]): Promise<Album[]> => {
  const chunks = sliceIntoChunks(albumsId, 20);
  const fetches = await Promise.all(chunks.map((chunk) => fetchAlbums(chunk)));

  return fetches.flatMap((albums) => albums.albums);
};

const fetchAlbums = async (albumsId: string[]): Promise<AlbumsResponse> => {
  const response = await fetch("https://api.spotify.com/v1/albums?ids=" + albumsId.join(","), {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });

  return await response.json();
};

const getRecommendations = async (trackId: string): Promise<AudioFeatures> => {
  "https://api.spotify.com/v1/recommendations?limit=10&seed_artists=3r1XkJ7vCs8kHBSzGvPLdP&seed_genres=sad&seed_tracks=5SpZDtg5U1W35HNjq1xYrM";
  const response = await fetch("https://api.spotify.com/v1/audio-features?ids=" + trackId, {
    headers: {
      Authorization: `Bearer ${await getToken()}`,
    },
  });

  cachedAudioFeatures = ((await response.json()) as any).audio_features[0];
  return cachedAudioFeatures!;
};

const appRouter = trpc
  .router()
  .query("get-current-activity", {
    async resolve() {
      const body = await fetchCurrentlyPlayingTrack();
      const res: GetCurrentActivity = {
        title: body.item.name,
        url: body.item.external_urls.spotify,
        artists: body.item.artists.map((artist: any) => artist.name),
        audioFeatures: await getAudioFeatures(body.item.id),
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

      const artistIds = playlist?.tracks?.items?.map((item) => item.track.artists[0].id) ?? [];
      const albumIds = playlist?.tracks?.items?.map((item) => item.track.album.id) ?? [];

      const artists = await getArtists(artistIds);
      const albums = await getAlbums(albumIds);

      const response: Playlist = {
        ...playlist,
        tracks: {
          ...playlist.tracks,
          items: playlist.tracks.items.map((item) => {
            const album = albums.find((album) => album.id === item.track.album.id);

            const artist = artists.find((artist: Artist) => artist.id === item.track.artists[0].id);

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
