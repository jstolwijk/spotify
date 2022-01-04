import type { NextPage } from "next";
import { trpc } from "../utils/trpc";

const Home: NextPage = () => {
  const activity = trpc.useQuery(["get-current-activity"], { refetchInterval: 10000 });

  return (
    <div className="h-screen w-screen flex flex-col justify-center items-center">
      <div className="flex flex-col border p-4">
        <h1 className="text-3xl font-bold">{activity.data?.title}</h1>
        <h2 className="text-xl">{activity.data?.artists?.join(", ")}</h2>
      </div>
    </div>
  );
};

export default Home;
