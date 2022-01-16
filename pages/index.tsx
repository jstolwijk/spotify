import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
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
    <div className="overflow-hidden h-screen">
      {activity.data && (
        <ProgressBar
          progressMs={activity.data?.progressMs}
          durationMs={activity.data?.durationMs}
          bg={getBg(activity?.data?.audioFeatures)}
        />
      )}
      <div
        className={"h-full w-screen flex flex-col justify-center items-center " + getBg(activity?.data?.audioFeatures)}
      >
        <div className="flex flex-col max-w-screen-sm">
          {activity.data?.image && (
            <div>
              <Image src={activity.data?.image} alt="Album art" width={640} height={640} />
            </div>
          )}
          <a href={activity.data?.url} target="_blank" rel="noreferrer" className="hover:underline cursor-pointer  p-8">
            <h1 className="text-5xl font-bold ">{activity.data?.title || "No music playing 😭"}</h1>
            <h2 className="mt-8 text-3xl">{activity.data?.artists?.join(", ")}</h2>
          </a>
          {activity.data?.isPlaying === false && <h3 className="m-8 text-2xl italic">Track paused</h3>}
        </div>
        <div className="pt-8 font-bold text-2xl">
          <Link href="/playlists">Jesses public playlists</Link>
        </div>
      </div>
    </div>
  );
};

const ProgressBar: FC<{ progressMs: number; durationMs: number; bg: string }> = ({ progressMs, durationMs, bg }) => {
  const [estProgressMs, setEstProgress] = useState(progressMs);
  const [estDurationMs, setEstDuration] = useState(durationMs);

  useEffect(() => {
    setEstProgress(progressMs);
    setEstDuration(durationMs);
  }, [progressMs, durationMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEstProgress((d) => d + 100);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={"w-ful h-1 " + bg}>
      <div className="bg-white h-1" style={{ width: (estProgressMs / estDurationMs) * 100 + "%" }}></div>
    </div>
  );
};

export default Home;
