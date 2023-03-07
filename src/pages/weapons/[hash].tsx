import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { promises as fs } from "fs";
import { atom, useAtom, WritableAtom } from "jotai";
import {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import path from "path";
import { trpc } from "../../lib/trpc";
import { appRouter } from "../../server/routers/_app";
import {
  MasterWork,
  Mod,
  Trait,
  Weapon,
  WeaponLite,
} from "../../types/weaponTypes";

const ornamentAtom = atom(
  { icon: "", screenshot: "" },
  (get, set, props: { icon: string; screenshot: string }) => {
    const currentOrnament = get(ornamentAtom);
    set(
      ornamentAtom,
      currentOrnament.icon === props.icon ? { icon: "", screenshot: "" } : props
    );
  }
);

const selectedPerksAtom = atom(
  new Map<number, Trait>(),
  (get, set, props: { column: number; trait: Trait }) => {
    const { column, trait } = props;
    const selectedPerks = get(selectedPerksAtom);
    selectedPerks.set(column, trait);
    //@ts-ignore TODO
    set(selectedPerksAtom, new Map(selectedPerks));
  }
);

const previewPerkAtom = atom<Trait | null>(null);
const setPreviewPerkAtom = atom(null, (get, set, perk: Trait) => {
  const previewPerk = get(previewPerkAtom);
  if (!previewPerk) set(previewPerkAtom, perk);
  else set(previewPerkAtom, previewPerk.hash === perk.hash ? null : perk);
});

const modAtom = atom<Mod | null>(null);
const setModAtom = atom(null, (get, set, mod: Mod) => {
  const selectedMod = get(modAtom);
  if (!selectedMod) set(modAtom, mod);
  else set(modAtom, selectedMod.hash === mod.hash ? null : mod);
});

const masterWorkAtom = atom<MasterWork | null>(null);
const setMasterWorkAtom = atom(null, (get, set, masterWork: MasterWork) => {
  const selectedMasterWork = get(masterWorkAtom);
  if (!selectedMasterWork) set(masterWorkAtom, masterWork);
  else
    set(
      masterWorkAtom,
      selectedMasterWork.hash === masterWork.hash ? null : masterWork
    );
});

export default function WeaponPage(
  props: InferGetServerSidePropsType<typeof getStaticProps>
) {
  const { hash } = props;
  const { status, data } = trpc.weaponByID.useQuery(hash);
  if (status !== "success") return <div>loading...</div>;
  return (
    <>
      <Head>
        <title>{data.name}</title>
      </Head>
      <main>
        <WeaponBanner weapon={data} />
      </main>
    </>
  );
}

function Ornaments(props: { weapon: Weapon }) {
  const { weapon } = props;
  const weaponOrnament = weapon.sockets.ornament;
  const [_, setOrnament] = useAtom(ornamentAtom);
  if (!weaponOrnament) return null;
  return (
    <div>
      {weaponOrnament.items.map((e) => (
        <li
          key={e.hash}
          onClick={() =>
            setOrnament({ icon: e.icon, screenshot: e.screenshot })
          }
        >
          {e.name}
        </li>
      ))}
    </div>
  );
}

function WeaponBanner(props: { weapon: Weapon }) {
  const [{ icon, screenshot }] = useAtom(ornamentAtom);
  const { weapon } = props;
  return (
    <article>
      <img
        src={
          process.env.NEXT_PUBLIC_BUNGIE_URL +
          (screenshot.length > 0 ? screenshot : weapon.screenshot)
        }
      ></img>
      <div className=" sticky row-start-2 bg-black bg-opacity-10 backdrop-blur">
        <div className="grid grid-cols-[auto_1fr] items-center p-2">
          <img
            className="w-20 outline outline-2"
            src={
              process.env.NEXT_PUBLIC_BUNGIE_URL +
              (icon.length > 0 ? icon : weapon.icon)
            }
            alt=""
            loading="lazy"
            decoding="async"
          />
          <div className="px-4">
            <p className="text-xl font-bold">{weapon.name}</p>
            <p className="items-center text-lg font-light italic">
              {weapon.itemTypeAndTierDisplayName}
            </p>
          </div>
        </div>
      </div>
      <ul>
        {["range", "handling", "reload", "TTK"].map((e) => (
          <li key={e} className="flex gap-2">
            <p>{e}</p>soon&trade;
          </li>
        ))}
      </ul>
    </article>
  );
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
