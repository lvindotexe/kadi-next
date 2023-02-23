import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { trpc } from "../../lib/trpc";

const Weapon: NextPage = () => {
  const { weapon: weaponID } = useRouter().query;
  const { status, data } = trpc.weaponByID.useQuery("6857689");

  return <Link href={"/"}>{JSON.stringify(data)}</Link>;
};

export default Weapon;
