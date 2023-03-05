import { get } from "idb-keyval";
import { type NextPage } from "next";
import Head from "next/head";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { NavBar } from "../components/Navbar";
import {
  categorisedWeaponsAtom,
  filteredWeaponsAtom,
  searchInputAtom,
} from "../hooks/search";
import { fetchAndCache } from "../lib/utils";
import { WeaponLite } from "../types/weaponTypes";

export function initialiseHomePage() {
  //@ts-ignore fix me
  return get("WeaponsLite").then((result) => {
    if (result) return Promise.resolve(result) as Promise<WeaponLite[]>;
    else
      return fetchAndCache("/api/WeaponsLite", "WeaponsLite") as Promise<
        WeaponLite[]
      >;
  });
}

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
  const [categorisedWeapons] = useAtom(categorisedWeaponsAtom);
  const [filteredWeapons] = useAtom(filteredWeaponsAtom);
  const [input] = useAtom(searchInputAtom);
  const hasCategorisedWeapons =
    categorisedWeapons.size > 0 &&
    [...categorisedWeapons.values()].every(
      (weaponCategory) => weaponCategory.length > 0
    );

  console.log(hasCategorisedWeapons, categorisedWeapons);

  function mapWeapons(weapons: WeaponLite[]) {
    return weapons.map((e) => (
      <li key={e.hash}>
        <Link href={`/w/${e.hash}`}>
          <ItemIcon key={e.hash} item={e} />
        </Link>
      </li>
    ));
  }

  return (
    <>
      <ul
        className={`${
          hasCategorisedWeapons
            ? "grid auto-rows-min gap-2"
            : "flex flex-wrap justify-center gap-2"
        }`}
      >
        {hasCategorisedWeapons
          ? [...categorisedWeapons.entries()].map(([key, values]) => (
              <div key={key}>
                <h1 className="text-3xl font-bold text-white">{key}</h1>
                <ul className="flex flex-wrap gap-2">{mapWeapons(values)}</ul>
              </div>
            ))
          : mapWeapons(filteredWeapons)}
      </ul>
    </>
  );
}

function HomePage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <NavBar />
      <WeaponGrid />
    </>
  );
}

const Home: NextPage = () => {
  const { status, data } = useQuery(["manifestversion"], () =>
    get("WeaponsLite").then((result) => {
      if (result) return Promise.resolve(result) as Promise<WeaponLite[]>;
      else
        return fetchAndCache("/api/WeaponsLite", "WeaponsLite") as Promise<
          WeaponLite[]
        >;
    })
  );

  return (
    <>
      <Head>
        <title>Kadi-One</title>
        <meta name="description" content="A destiny 2 companion app" />
      </Head>

      <main className="grid min-h-screen items-center bg-black">
        {status === "loading" ? (
          <div className="text-white">loading</div>
        ) : status === "success" ? (
          <HomePage />
        ) : (
          <div>oops</div>
        )}
      </main>
    </>
  );
};

export default Home;
