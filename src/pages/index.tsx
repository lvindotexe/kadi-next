import { get } from "idb-keyval";
import { type NextPage } from "next";
import Head from "next/head";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavBar, NavBarSearchInput } from "../components/Navbar";
import { useWeaponSearch } from "../hooks/search";
import { debounce, fetchAndCache } from "../lib/utils";
import { WeaponLite } from "../types/weaponTypes";
import {
  elementScroll,
  useVirtualizer,
  VirtualizerOptions,
} from "@tanstack/react-virtual";
import { IconEaseInOut } from "@tabler/icons-react";
import { each } from "immer/dist/internal";

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

function WeaponGrid({ weapons }: { weapons: WeaponLite[] }) {
  return (
    <>
      <ul className="flex flex-wrap justify-center gap-2">
        {weapons.map((e) => (
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

function HomePage({ data }: { data: WeaponLite[] }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    setInput,
    filteredWeapons,
    parameters,
    updateFilterFunctions,
    setSortBy,
    input,
  } = useWeaponSearch(data, inputRef, "empty");
  const [showFilters, setShowFilters] = useState(false);
  const debouncedInput = useMemo(() => debounce(setInput, 100), []);

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <NavBar
        setInput={setInput}
        input={input}
        showFilters={true}
        setShowFilters={setShowFilters}
        parameters={parameters}
        setSortBy={setSortBy}
        resultsLength={69}
        updateFilterFunctions={updateFilterFunctions}
      >
        <NavBarSearchInput
          ref={inputRef}
          setInput={debouncedInput}
          className="grow rounded-md bg-gray-900 px-2 text-3xl text-white outline-none"
        />
      </NavBar>
      {filteredWeapons && <WeaponGrid weapons={filteredWeapons} />}
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
          <HomePage data={data} />
        ) : (
          <div>oops</div>
        )}
      </main>
    </>
  );
};

export default Home;
