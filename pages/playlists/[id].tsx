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

const Playlist: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const playlistId = id as string;

  const playlist = trpc.useQuery(["playlist", playlistId]);
  const genres = orderByFrequency(playlist.data?.tracks?.items?.flatMap((item: any) => item.track.genres) ?? []);

  if (!playlist.data) {
    return null;
  }

  return (
    <div>
      <h1 className="text-4xl">{playlist.data?.name}</h1>
      <h3 className="text-2xl">
        Top genres: {genres[0]}, {genres[1]}, {genres[2]}, {genres[3]}, {genres[4]}
      </h3>
      <h3>
        Avg danceability:
        {(playlist.data?.tracks?.items?.reduce((acc, item) => acc + item.track.audio_features?.danceability, 0) ?? 0) /
          playlist.data?.tracks?.items?.length ?? 0}
      </h3>
      <div className="p-4" />
      <ul>
        {playlist.data?.tracks?.items?.map((item) => (
          <li key={item.track.id}>
            {item.track.name} - {item.track.genres.join(",")}
            <div>{JSON.stringify(item.track.audio_features)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
  //   return <div>{playlist.data?.tracks?.items?.map((item: any) => item.track.id)?.join(",")}</div>;
};

export default Playlist;
