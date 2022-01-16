import type { NextPage } from "next";
import Link from "next/link";
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
    <div>
      <div
        className={
          "h-screen w-screen flex flex-col justify-center items-center " + getBg(activity?.data?.audioFeatures)
        }
      >
        <a href={activity.data?.url} target="_blank" rel="noreferrer">
          <div className="flex flex-col border p-8 hover:underline cursor-pointer">
            <h1 className="text-5xl font-bold ">{activity.data?.title || "No music playing 😭"}</h1>
            <h2 className="mt-8 text-3xl">{activity.data?.artists?.join(", ")}</h2>
          </div>
        </a>
        <div className="pt-8 font-bold text-2xl">
          <Link href="/playlists">Jesses public playlists</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
