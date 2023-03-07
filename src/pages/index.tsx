import { useAtom } from "jotai";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { NavBar } from "../components/Navbar";
import { filteredWeaponsAtom, weaponsLiteAtom } from "../hooks/search";
import { trpc } from "../lib/trpc";

type ItemIconProps = {
  iconWatermark?: string;
  icon: string;
  tierTypeHash: number;
};

export function ItemIcon({ item }: { item: ItemIconProps }) {
  //basic: #c2bbb3
  //rare: #4f76a2
  //common: #366f42
  //exotic: #ceae33
  //legendary:#ccac31
  return (
    <div
      className="grid aspect-square w-16 border-[1px]"
      style={{
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundImage: `url(${
          process.env.NEXT_PUBLIC_BUNGIE_URL + item.icon
        })`,
      }}
    >
      {item.iconWatermark ? (
        <img
          src={process.env.NEXT_PUBLIC_BUNGIE_URL + item.iconWatermark}
          alt=""
        />
      ) : null}
    </div>
  );
}

function WeaponGrid() {
  const [filteredWeapons] = useAtom(filteredWeaponsAtom);
  return (
    <>
      <ul className="flex flex-wrap justify-center gap-2">
        {filteredWeapons.map((e) => (
          <li key={e.hash}>
            <Link href={`/weapons/${e.hash}`}>
              <ItemIcon key={e.hash} item={e} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function HomePage() {
  const { status, data } = trpc.weapons.useQuery();
  const [_, setWeapons] = useAtom(weaponsLiteAtom);
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
    if (status === "success") setWeapons(data);
  }, [status]);
  if (status !== "success")
    return <div className="bg-red-400 text-black">loading...</div>;
  return (
    <>
      <NavBar />
      <WeaponGrid />
    </>
  );
}

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Kadi-One</title>
        <meta name="description" content="A destiny 2 companion app" />
      </Head>

      <main className="grid min-h-screen items-center bg-black">
        <HomePage />
      </main>
    </>
  );
};

export default Home;
