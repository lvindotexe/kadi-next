import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { promises as fs } from "fs";
import {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetServerSidePropsType,
} from "next";
import path from "path";
import { trpc } from "../../lib/trpc";
import { appRouter } from "../../server/routers/_app";
import { WeaponLite } from "../../types/weaponTypes";
export default function WeaponPage(
  props: InferGetServerSidePropsType<typeof getStaticProps>
) {
  const { hash } = props;
  const { status, data: weapon } = trpc.weaponByID.useQuery(hash);
  if (status !== "success") return <div>loading...</div>;
  return <div></div>;
}

export async function getStaticProps(
  context: GetStaticPropsContext<{ hash: string }>
) {
  const ssgHelper = await createProxySSGHelpers({
    router: appRouter,
    ctx: {},
  });

  const hash = context.params!.hash;
  await ssgHelper.weaponByID.prefetch(hash);
  return {
    props: {
      hash,
    },
  };
}

export const getStaticPaths: GetStaticPaths = () => {
  return fs
    .readFile(path.resolve() + "/public/WeaponsLite.json", "utf-8")
    .then((content) => JSON.parse(content) as WeaponLite[])
    .then((weapons) => ({
      paths: weapons.map((e) => ({ params: { hash: e.hash.toString() } })),
      fallback: "blocking",
    }));
};
