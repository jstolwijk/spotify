import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

const getToken = async () => {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`),
    },
    body: `grant_type=refresh_token&refresh_token=${process.env.REFRESH_TOKEN}`,
  });

  return (await res.json()).access_token;
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
}

const appRouter = trpc.router().query("get-current-activity", {
  async resolve() {
    const body = await fetchCurrentlyPlayingTrack();
    const res: GetCurrentActivity = {
      title: body.item.name,
      artists: body.item.artists.map((artist: any) => artist.name),
    };

    return res;
  },
});

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
