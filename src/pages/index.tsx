import { type NextPage } from "next";
import Head from "next/head";

import { useQuery } from "@tanstack/react-query";
import { getDestinyManifest } from "bungie-api-ts/destiny2";
import { useMemo, useRef, useState } from "react";
import { NavBar, NavBarSearchInput } from "../components/Navbar";
import { useWeaponSearch } from "../hooks/search";
import { generateHttpClient } from "../lib/utils";
import { WeaponLite } from "../types/weaponTypes";
import Link from "next/link";

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
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(4rem,max-content))] justify-around gap-2">
        {weapons.map((w) => (
          <li>
            <Link href={`/w/${w.hash}`}>
              <ItemIcon key={w.hash} item={w} />
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
  } = useWeaponSearch(data, inputRef);
  const [showFilters, setShowFilters] = useState(false);
  return (
    <>
      <NavBar
        setInput={setInput}
        showFilters={true}
        setShowFilters={setShowFilters}
        parameters={parameters}
        setSortBy={setSortBy}
        updateFilterFunctions={updateFilterFunctions}
      >
        <NavBarSearchInput ref={inputRef} setInput={setInput} />
      </NavBar>
      {filteredWeapons && <WeaponGrid weapons={filteredWeapons} />}
    </>
  );
}

const Home: NextPage = () => {
  const httpClient = useMemo(
    () => generateHttpClient(fetch, process.env.NEXT_PUBLIC_KEY!),
    []
  );
  const { status, data } = useQuery(["manifestversion"], () =>
    getDestinyManifest(httpClient)
      .then((result) => result.Response)
      .then((response) => {
        localStorage.setItem("manifest", JSON.stringify(response));
      })
      .then(() => fetch("/api/WeaponsLite"))
      .then((response) => response.json() as Promise<WeaponLite[]>)
  );

  return (
    <>
      <Head>
        <title>Kadi-One</title>
        <meta name="description" content="A destiny 2 companion app" />
      </Head>
      <main className="grid items-center bg-black">
        {status === "loading" ? (
          <div>loading</div>
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
