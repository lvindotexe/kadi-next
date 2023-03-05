import { IconCircleX, IconMenu2, IconSearch, IconX } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  DestinyStatDefinition,
  DestinyStatGroupDefinition,
} from "bungie-api-ts/destiny2";
import { atom, useAtom } from "jotai";
import React, {
  forwardRef,
  MutableRefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useClickOutside } from "../hooks/hooks";
import {
  categorisedWeaponsAtom,
  NonRecordWeaponLiteProperties,
  searchInputAtom,
  selectedCategoriesAtom,
} from "../hooks/search";
import { debounce, getManifestTables } from "../lib/utils";
import {
  AllWeaponPropertyDefinitions,
  ammoTypes,
  defaultDamageTypes,
  equipmentSlotTypes,
  itemCategories,
} from "../types/types";
import { WeaponLite } from "../types/weaponTypes";

type ToggleGroupProps<T extends NonRecordWeaponLiteProperties> = {
  title: string;
  weaponProperty: T;
  weaponPropertyCategories: AllWeaponPropertyDefinitions[T];
};
export function ToggleGroup<T extends NonRecordWeaponLiteProperties>({
  title,
  weaponProperty: key,
  weaponPropertyCategories,
}: ToggleGroupProps<T>) {
  if (!weaponPropertyCategories) return null;
  return (
    <div>
      <p className=" text-xl font-bold text-gray-300">{title}</p>
      <ul className="flex shrink grow flex-wrap gap-2 py-4">
        {Object.entries(weaponPropertyCategories).map(([k, v], index) => (
          <ToggleItem key={k + index} name={k} hash={v} propertyKey={key} />
        ))}
      </ul>
    </div>
  );
}

type ToggleItemProps = {
  name: string;
  hash: number;
  propertyKey: NonRecordWeaponLiteProperties;
};
export function ToggleItem({ name, hash, propertyKey }: ToggleItemProps) {
  const [selectedCategories, setSelectedCategories] = useAtom(
    selectedCategoriesAtom
  );
  const setter = useMemo(() => debounce(setSelectedCategories, 100), []);
  const selected = selectedCategories.has(propertyKey)
    ? //@ts-ignore TODO
      selectedCategories.get(propertyKey)!.has(hash)
    : false;
  // if (selectedCategories.size > 0) console.log(selectedCategories);

  return (
    <button
      className={`${
        selected ? "bg-gray-300" : "border-[1px] bg-gray-900"
      } rounded-full px-4 py-[0.1rem] text-[1.1rem] ${
        selected ? "text-gray-900" : "text-gray-300"
      }`}
      //@ts-ignore TODO
      onClick={() => setter({ hash, weaponPropertyKey: propertyKey })}
    >
      {name}
    </button>
  );
}

function SelectedCategories() {
  const [selectedCategories, setSelectedCategories] = useAtom(
    selectedCategoriesAtom
  );

  const selectedItems = [...selectedCategories.entries()]
    .flatMap(([key, values]) =>
      values ? [...values.entries()].map((e) => [key, e] as const) : undefined
    )
    .filter(Boolean);
  console.log(selectedItems);

  if (selectedCategories.size === 0) return null;
  function handleClick(name: string) {}
  return (
    <>
      {/* <ul className="flex gap-2 overflow-scroll p-2">
        {selectedItems.map(([key,value], index) => (
          <button
            key={index}
            className={`rounded-md  bg-gray-700 px-4 py-[0.1rem]  text-white`}
            onClick={() => handleClick(item)}
          >
            {item}
          </button>
        ))}
      </ul> */}
    </>
  );
}

export function NavBarButton({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return <button {...props}>{children}</button>;
}

const showFiltersAtom = atom(false);

export function NavBar() {
  const [showFilters, setShowFilters] = useAtom(showFiltersAtom);
  const navRef = useRef<HTMLElement | null>(null);
  useClickOutside(navRef, () => setShowFilters(false));

  const [input, setInput] = useAtom(searchInputAtom);
  const debouncedSetInput = useMemo(() => debounce(setInput, 100), []);

  return (
    <div className="fixed bottom-1 w-full">
      <div className="flex bg-transparent p-10">
        <nav
          ref={navRef}
          onMouseLeave={() => setShowFilters(false)}
          className="m-auto rounded-md bg-gray-700 bg-opacity-70"
        >
          <WeaponFilterToggleMenu />
          {!showFilters && <SelectedCategories />}
          <div className="m-2 flex gap-2 ">
            <div className="flex items-center gap-2 rounded-md bg-gray-700 p-2 text-center text-2xl text-white">
              <span className="flex">
                <p className="font-bold">Kadi</p>&nbsp;
                <p>One</p>
              </span>
              <NavBarButton onClick={() => setShowFilters((prev) => !prev)}>
                {showFilters ? (
                  <IconX size={36} color="white" />
                ) : (
                  <IconMenu2 size={36} color="white" />
                )}
              </NavBarButton>
            </div>
            <div className=" flex grow gap-2 rounded-md bg-gray-900 px-2">
              <input
                placeholder="search..."
                className="grow rounded-md bg-gray-900 px-2 text-3xl text-white outline-none "
                onChange={(e) => debouncedSetInput(e.target.value)}
              />
              <div className="gap flex items-center">
                <NavBarButton className="grow-0">
                  {input.length > 0 ? (
                    <IconCircleX
                      size={36}
                      color={"white"}
                      onClick={() => setInput("")}
                    />
                  ) : (
                    <IconSearch size={36} color={"white"} />
                  )}
                </NavBarButton>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

export function WeaponFilterToggleMenu<T extends keyof WeaponLite>() {
  const [showFilters] = useAtom(showFiltersAtom);
  const [categorisedWeapons] = useAtom(categorisedWeaponsAtom);
  const resultsLength = [...categorisedWeapons.values()].flat().length;
  return (
    <div
      className={`${
        showFilters ? "flex" : "hidden"
      } m-2 shrink grow flex-col overflow-y-scroll rounded-md bg-gray-900 p-2 sm:top-8 sm:max-h-[90vh] sm:basis-0 sm:overflow-auto`}
    >
      <ToggleGroup
        title={"Ammo Type"}
        weaponProperty="ammoType"
        weaponPropertyCategories={ammoTypes.propertyHashes}
      />
      <ToggleGroup
        title="Element"
        weaponProperty="defaultDamageType"
        weaponPropertyCategories={defaultDamageTypes.propertyHashes}
      />
      <ToggleGroup
        title="Slot"
        weaponProperty="equipmentSlotTypeHash"
        weaponPropertyCategories={equipmentSlotTypes.propertyHashes}
      />
      <ToggleGroup
        title="Weapon Type"
        weaponProperty="itemCategory"
        weaponPropertyCategories={itemCategories.propertyHashes}
      />
      {resultsLength > 0 && (
        <span className="flex text-xl text-white">
          <p className="font-bold">{resultsLength}</p>&nbsp;
          <p>weapons found</p>
        </span>
      )}
    </div>
  );
}
