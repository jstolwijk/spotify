import { NextPage } from "next";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";

const orderByFrequency = (array: string[]) => {
  const grouped = array.reduce((acc: any, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.keys(grouped).sort((a, b) => grouped[b] - grouped[a]);
  return sorted;
};

const avarage = (array: number[]) => {
  return array.reduce((acc, curr) => acc + curr, 0) / array.length;
};

const Playlist: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const playlistId = id as string;

  const playlist = trpc.useQuery(["playlist", playlistId]);
  const genres = orderByFrequency(playlist.data?.tracks?.items?.flatMap((item: any) => item.track.genres) ?? []);

  if (!playlist.data) {
    return null;
  }
  const avgDanceability = avarage(
    playlist.data.tracks.items.map((item: any) => item.track.audio_features.danceability)
  );
  const avgEnergy = avarage(playlist.data.tracks.items.map((item: any) => item.track.audio_features.energy));

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold">{playlist.data?.name}</h1>
      <h3 className="text-2xl">
        Top genres: {genres[0]}, {genres[1]}, {genres[2]}, {genres[3]}, {genres[4]}
      </h3>
      <h3>Avg danceability: {avgDanceability}</h3>
      <h3>Avg energy: {avgEnergy}</h3>
      <ul className="pt-4">
        {playlist.data?.tracks?.items?.map((item) => (
          <li key={item.track.id} className="flex p-2">
            <div>{item.track.name}</div>
            <div className="pl-4">{item.track.artists.map((it) => it.name).join(", ")}</div>
            <div className=" flex-grow" />
            <div
              className={
                Math.abs(item.track.audio_features?.danceability - avgDanceability) > 0.2
                  ? "underline decoration-pink-500 w-32"
                  : "w-32"
              }
            >
              {item.track.audio_features?.danceability}
            </div>
            <div
              className={
                Math.abs(item.track.audio_features?.energy - avgEnergy) > 0.2 ? "underline decoration-pink-500" : ""
              }
            >
              {item.track.audio_features?.energy}
            </div>
            {/* <div>{item.track.genres.join(",")}</div> */}
            {/* <div>{JSON.stringify(item.track.audio_features)}</div> */}
          </li>
        ))}
      </ul>
    </div>
  );
  //   return <div>{playlist.data?.tracks?.items?.map((item: any) => item.track.id)?.join(",")}</div>;
};

export default Playlist;
