import { IconCircleX, IconMenu2, IconSearch, IconX } from "@tabler/icons-react";
import { keys } from "idb-keyval";
import { atom, useAtom } from "jotai";
import React, { useMemo, useRef } from "react";
import { number } from "zod";
import { useClickOutside } from "../hooks/hooks";
import {
  allWeaponPropertyHashes,
  categorisedWeaponsAtom,
  NonRecordWeaponLiteProperties,
  reversedWeaponPropertyHashes,
  searchInputAtom,
  selectedCategoriesAtom,
} from "../hooks/search";
import { debounce, isNotNullOrUndefined } from "../lib/utils";
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
  weaponPropertyCategories: AllWeaponPropertyDefinitions[T]["propertyHashes"];
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
          //@ts-ignore compiler annoying
          <ToggleItem key={k + index} name={k} hash={v} propertyKey={key} />
        ))}
      </ul>
    </div>
  );
}

type ToggleItemProps<T extends keyof AllWeaponPropertyDefinitions> = {
  hash: AllWeaponPropertyDefinitions[T]["propertyHashes"][keyof AllWeaponPropertyDefinitions[T]["propertyHashes"]];
  name: keyof AllWeaponPropertyDefinitions[T]["propertyHashes"];
  propertyKey: T;
};
export function ToggleItem<T extends keyof AllWeaponPropertyDefinitions>({
  name,
  hash,
  propertyKey,
}: ToggleItemProps<T>) {
  const [selectedCategories, setSelectedCategories] = useAtom(
    selectedCategoriesAtom
  );
  const setter = useMemo(() => debounce(setSelectedCategories, 100), []);
  const selected = selectedCategories.has(propertyKey)
    ? //@ts-ignore compiler annoying
      selectedCategories.get(propertyKey)!.has(hash)
    : false;

  return (
    <button
      className={`${
        selected ? "bg-gray-300" : "border-[1px] bg-gray-900"
      } rounded-md px-4 py-[0.1rem] text-[1.1rem] ${
        selected ? "text-gray-900" : "text-gray-300"
      }`}
      //@ts-ignore
      onClick={() => setter({ hash, weaponPropertyKey: propertyKey })}
    >
      {name as string}
    </button>
  );
}

function SelectedCategories() {
  const [selectedCategories, setSelectedCategories] = useAtom(
    selectedCategoriesAtom
  );

  const selectedItems = [...selectedCategories.entries()]
    .flatMap(([key, values]) =>
      values ? Array.from(values).map((e) => [key, e] as const) : undefined
    )
    .filter(isNotNullOrUndefined);
  //TODO apparently memoizing and debouncing this fixes reset to Suspense fallback on click
  const setter = useMemo(
    () =>
      debounce(
        (hash: number, weaponPropertyKey: NonRecordWeaponLiteProperties) =>
          setSelectedCategories({ hash, weaponPropertyKey }),
        50
      ),
    []
  );
  const hasSelectedItems =
    selectedCategories.size > 0 &&
    [...selectedCategories.values()].some((e) => e.size > 0);

  return (
    <>
      {hasSelectedItems && (
        <ul className="flex gap-2 overflow-scroll p-2">
          {selectedItems.map(([key, value], index) => (
            <button
              key={index}
              className={`rounded-md  bg-gray-300 px-4 py-[0.1rem]  text-gray-900`}
              onClick={() => setter(value, key)}
            >
              {
                reversedWeaponPropertyHashes[key][value].replace(
                  "_",
                  " "
                ) as string
              }
            </button>
          ))}
        </ul>
      )}
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
