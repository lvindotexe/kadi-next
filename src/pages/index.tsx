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

function easeInOutQuint(t: any) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
}

function WeaponGrid({ weapons }: { weapons: WeaponLite[] }) {
  const ulRef = useRef<HTMLUListElement>(null);
  const scrollRef = useRef<number>();

  const scrollToFn: VirtualizerOptions<any, any>["scrollToFn"] = useMemo(
    () => (offset, canSmooth, instance) => {
      const duration = 1000;
      const start = ulRef.current?.scrollTop!;
      const startTime = (scrollRef.current = Date.now());

      function run() {
        if (scrollRef.current !== startTime) return;
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = easeInOutQuint(Math.min(elapsed / duration, 1));
        const interpolated = start + (offset - start) * progress;

        if (elapsed < duration) {
          elementScroll(interpolated, canSmooth, instance);
          requestAnimationFrame(run);
        } else elementScroll(interpolated, canSmooth, instance);
      }
      requestAnimationFrame(run);
    },
    []
  );

  const virtualiser = useVirtualizer({
    count: weapons.length,
    getScrollElement: () => ulRef.current,
    estimateSize: () => 100,
    overscan: 10,
    scrollToFn,
  });
  return (
    <>
      <ul ref={ulRef} className="flex flex-wrap justify-center gap-2">
        {virtualiser.getVirtualItems().map((e) => {
          const weapon = weapons[e.index];
          if (!weapon) return null;
          return (
            <li key={weapon.hash}>
              <Link href={`/w/${weapon.hash}`}>
                <ItemIcon key={weapon.hash} item={weapon} />
              </Link>
            </li>
          );
        })}
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
  } = useWeaponSearch(data, inputRef);
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
        updateFilterFunctions={updateFilterFunctions}
      >
        <NavBarSearchInput
          ref={inputRef}
          setInput={debouncedInput}
          className="rounded-md bg-gray-900 px-2 text-3xl text-white outline-none"
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
