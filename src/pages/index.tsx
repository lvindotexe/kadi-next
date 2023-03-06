import { useQuery } from "@tanstack/react-query";
import { get } from "idb-keyval";
import { useAtom } from "jotai";
import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { NavBar } from "../components/Navbar";
import {
  filteredWeaponsAtom,
  searchInputAtom,
  selectedCategoriesAtom,
} from "../hooks/search";
import { fetchAndCache } from "../lib/utils";
import { WeaponLite } from "../types/weaponTypes";

export function initialiseHomePage() {
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
  const [filteredWeapons] = useAtom(filteredWeaponsAtom);
  const [input] = useAtom(searchInputAtom);
  const [selectedCategories] = useAtom(selectedCategoriesAtom);

  if (input.length === 0 && selectedCategories.size === 0) return null;
  return (
    <>
      <ul className="flex flex-wrap justify-center gap-2">
        {filteredWeapons.map((e) => (
          <li key={e.hash}>
            <Link href={`/w/${e.hash}`}>
              <ItemIcon key={e.hash} item={e} />
            </Link>
          </li>
        ))}
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
