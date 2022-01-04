import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

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