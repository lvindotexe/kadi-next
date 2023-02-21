import { type NextPage } from "next";
import Head from "next/head";

import { useQuery } from "@tanstack/react-query";
import { WeaponLite } from "../types/weaponTypes";
import { useWeaponSearch } from "../hooks/search";
import { debounce, generateHttpClient } from "../lib/utils";
import { ToggleGroup, ToggleStatGroup } from "./components/Navbar";
import {
  ammoTypes,
  archeTypes,
  defaultDamageTypes,
  equipmentSlotTypes,
} from "../types/types";
import { useMemo, useState } from "react";
import { getDestinyManifest } from "bungie-api-ts/destiny2";

type ItemIcon = {
  iconWatermark?: string;
  icon: string;
  tierTypeHash: number;
};

export function ItemIcon({ item }: { item: ItemIcon }) {
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
      <ul className="m-auto flex flex-wrap gap-1">
        {weapons.map((w) => (
          <li>
            <ItemIcon key={w.hash} item={w} />
          </li>
        ))}
      </ul>
    </>
  );
}

export const NavBar: React.FC<{
  setInput: (input: string) => void;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setShowFilters, showFilters, setInput }) => {
  const inputSetter = debounce(setInput, 75);
  return (
    <>
      <nav className="flex items-center justify-between p-2">
        <p className="text-2xl font-bold">Kadi-one</p>
        <div className="flex rounded-full border-[1px] bg-zinc-600">
          <input
            className=" w-full rounded-full bg-zinc-600 px-2 text-2xl font-bold placeholder:text-white focus:outline-none"
            type="text"
            onChange={(e) => inputSetter(e.target.value.toLowerCase())}
          />
          <button
            className=" grid aspect-square h-10 w-10 place-items-center rounded-full bg-white"
            onClick={() => {
              setShowFilters(!showFilters);
            }}
          >
            <p className="items-center text-black">
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.99961 3H19.9997C20.552 3 20.9997 3.44764 20.9997 3.99987L20.9999 5.58569C21 5.85097 20.8946 6.10538 20.707 6.29295L14.2925 12.7071C14.105 12.8946 13.9996 13.149 13.9996 13.4142L13.9996 19.7192C13.9996 20.3698 13.3882 20.8472 12.7571 20.6894L10.7571 20.1894C10.3119 20.0781 9.99961 19.6781 9.99961 19.2192L9.99961 13.4142C9.99961 13.149 9.89425 12.8946 9.70672 12.7071L3.2925 6.29289C3.10496 6.10536 2.99961 5.851 2.99961 5.58579V4C2.99961 3.44772 3.44732 3 3.99961 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </p>
          </button>
        </div>
      </nav>
    </>
  );
};

type WeaponFilterToggleMenuProps = {
  updateFilterFunctions: ReturnType<
    typeof useWeaponSearch
  >["updateFilterFunctions"];
  show: boolean;
  setSortBy: ReturnType<typeof useWeaponSearch>["setSortBy"];
  parameters: ReturnType<typeof useWeaponSearch>["parameters"];
};

export function WeaponFilterToggleMenu<T extends keyof WeaponLite>({
  updateFilterFunctions,
  show,
  parameters,
  setSortBy,
}: WeaponFilterToggleMenuProps) {
  return (
    <div
      className={`${
        show ? "flex" : "hidden"
      } m-2 shrink grow flex-col overflow-y-scroll sm:top-8 sm:max-h-[90vh] sm:basis-0 sm:overflow-auto`}
    >
      <ToggleGroup
        title={"Ammo Type"}
        propertyHashes={ammoTypes}
        updateFilterFunctions={updateFilterFunctions}
      />
      <ToggleGroup
        title="Element"
        propertyHashes={defaultDamageTypes}
        updateFilterFunctions={updateFilterFunctions}
      />
      <ToggleGroup
        title="Slot"
        propertyHashes={equipmentSlotTypes}
        updateFilterFunctions={updateFilterFunctions}
      />
      <ToggleGroup
        title="Weapon Type"
        propertyHashes={archeTypes}
        updateFilterFunctions={updateFilterFunctions}
      />
      {parameters.has("itemCategory") && parameters.size > 0 && (
        <ToggleStatGroup
          updateFilterFunctions={updateFilterFunctions}
          parameters={parameters}
          setSortBy={setSortBy}
        />
      )}
    </div>
  );
}

function HomePage({ data }: { data: WeaponLite[] }) {
  const {
    setInput,
    filteredWeapons,
    parameters,
    updateFilterFunctions,
    setSortBy,
  } = useWeaponSearch(data);
  const [showFilters, setShowFilters] = useState(false);
  return (
    <>
      <NavBar
        setInput={setInput}
        showFilters={true}
        setShowFilters={setShowFilters}
      />
      <WeaponFilterToggleMenu
        parameters={parameters}
        setSortBy={setSortBy}
        show={true}
        updateFilterFunctions={updateFilterFunctions}
      />
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
      <main className="grid items-center">
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
