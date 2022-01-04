import type { NextPage } from "next";
import { AudioFeatures } from "../types/audio-features";
import { trpc } from "../utils/trpc";

const getBg = (audioFeatures?: AudioFeatures) => {
  if (!audioFeatures) {
    return "bg-gray-800";
  }
  const energy = audioFeatures.energy;

  if (energy < 0.2) {
    return "bg-gray-800";
  } else if (energy > 0.7) {
    return "bg-orange-600";
  } else {
    return "bg-gray-500";
  }
};

const Home: NextPage = () => {
  const activity = trpc.useQuery(["get-current-activity"], { refetchInterval: 5000 });

  return (
    <div
      className={"h-screen w-screen flex flex-col justify-center items-center " + getBg(activity?.data?.audioFeatures)}
    >
      <div className="flex flex-col border p-4">
        <h1 className="text-3xl font-bold">{activity.data?.title || "No music playing 😭"}</h1>
        <h2 className="text-xl">{activity.data?.artists?.join(", ")}</h2>
      </div>
    </div>
  );
};

export default Home;
