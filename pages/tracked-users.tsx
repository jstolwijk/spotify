import { NextPage } from "next";
import { trpc } from "../utils/trpc";

const TrackedUsers: NextPage = () => {
  const trackedUsers = trpc.useQuery(["tracked-users"], {
    refetchInterval: 5000,
  });

  return (
    <div>
      <h2>Tracked users</h2>
      <div>
        <ul>
          {trackedUsers.data?.map((user) => (
            <li>{user}</li>
          ))}
        </ul>
        <button className="p-2 rounded bg-white text-black" onClick={() => console.log("Add")}>Add</button>
      </div>
    </div>
  );
};

export default TrackedUsers;
