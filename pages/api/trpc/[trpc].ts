import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";

const appRouter = trpc.router().query("get-current-activity", {
  resolve() {
    return {
      title: "FORCE OF HABIT",
      artist: "Paris texas",
    };
  },
});

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
