import { NextPage } from "next";
import { trpc } from "../utils/trpc";

const TrackedUsers: NextPage = () => {
  const users = trpc.useQuery(["tracked-users"], {
    refetchInterval: 5000,
  });

  return <div>Hello motherfucker {users.data}</div>;
};
export default TrackedUsers;
