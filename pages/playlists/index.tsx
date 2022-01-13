import { NextPage } from "next";
import Link from "next/link";
import { trpc } from "../../utils/trpc";

const Playlists: NextPage = () => {
  const playlists = trpc.useQuery(["get-playlists"]);

  return (
    <div>
      <h1 className="p-4 text-4xl font-bold">Playlists</h1>
      <div>
        {playlists.data?.items?.map((playlist: any) => (
          <div key={playlist.id} className="p-4 text-xl">
            <Link href={"/playlists/" + playlist.id}>{playlist.name}</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlists;
