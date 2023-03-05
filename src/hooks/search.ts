import { get as idbGet } from "idb-keyval";
import { atom } from "jotai";
import { atomsWithQuery } from "jotai-tanstack-query";
import { MutableRefObject, useState } from "react";
import { fetchAndCache } from "../lib/utils";
import {
  ammoTypes,
  defaultDamageTypes,
  equipmentSlotTypes,
  itemCategories,
  tierTypes,
  WeaponLiteFilterableProperties,
  WeaponPropertyDefinitions,
} from "../types/types";
import { WeaponLite } from "../types/weaponTypes";

export type FlattenArray<T> = T extends (infer U)[] ? U : T;
export type ArrayorMap<T> = T extends Record<any, unknown>
  ? Map<keyof T, T[keyof T]>
  : Array<T>;
export type FilterFunction = (w: WeaponLite) => boolean;
export type FilterImplementation<T extends keyof WeaponLite> = (
  types: ArrayorMap<FlattenArray<WeaponLite[T]>>,
  property: WeaponLite[T]
) => boolean;

export type NonRecordWeaponLiteProperties = Exclude<
  WeaponLiteFilterableProperties,
  "stats" | "perks"
>;
type PropertyHashes<
  T extends WeaponPropertyDefinitions<NonRecordWeaponLiteProperties>["propertyHashes"]
> =
  T extends WeaponPropertyDefinitions<NonRecordWeaponLiteProperties>["propertyHashes"]
    ? Array<T[keyof T]>
    : never;

type PropertyHasheKeys<
  T extends WeaponPropertyDefinitions<NonRecordWeaponLiteProperties>["propertyHashes"]
> =
  T extends WeaponPropertyDefinitions<NonRecordWeaponLiteProperties>["propertyHashes"]
    ? keyof T
    : never;

type pain = PropertyHasheKeys<
  WeaponPropertyDefinitions<NonRecordWeaponLiteProperties>["propertyHashes"]
>;

type zain = PropertyHashes<
  WeaponPropertyDefinitions<NonRecordWeaponLiteProperties>["propertyHashes"]
>;

//atoms
export const searchInputAtom = atom("", (get, set, input: string) => {
  console.log(input);
  set(searchInputAtom, input.toLowerCase());
});

type selectedCategoriesUptaterArgs = {
  hash: FlattenArray<zain>;
  weaponPropertyKey: NonRecordWeaponLiteProperties;
};

export const selectedCategoriesAtom = atom(
  new Map<NonRecordWeaponLiteProperties, Set<zain[number]>>(),
  (get, set, { hash, weaponPropertyKey }: selectedCategoriesUptaterArgs) => {
    const selectedCategories = get(selectedCategoriesAtom);
    if (selectedCategories.has(weaponPropertyKey)) {
      const oldData = selectedCategories.get(weaponPropertyKey)!;
      if (oldData.has(hash)) oldData.delete(hash);
      else oldData.add(hash);
      selectedCategories.set(weaponPropertyKey, oldData);
    } else {
      selectedCategories.set(weaponPropertyKey, new Set([hash]));
    }
    //@ts-ignore Close enough
    set(selectedCategoriesAtom, new Map([...selectedCategories]));
  }
);

export const weaponCategoriserAtom = atom((get) => {
  const selectedCategories = get(selectedCategoriesAtom);
  const result = new Map<
    NonRecordWeaponLiteProperties,
    (weapon: WeaponLite) => pain | undefined
  >();
  for (const [key, categories] of selectedCategories) {
    result.set(key, (weapon: WeaponLite) => {
      const result = categoriser(key, Array.from(categories), weapon[key]);
      return categoriser(key, Array.from(categories), weapon[key]);
    });
  }
  return result;
});

const [weaponsLiteAtom] = atomsWithQuery((get) => ({
  queryKey: ["weapons"],
  queryFn: () => {
    if (process.title === "browser") {
      return idbGet("WeaponsLite").then((result) => {
        if (result) return Promise.resolve(result) as Promise<WeaponLite[]>;
        else
          return fetchAndCache("/api/WeaponsLite", "WeaponsLite").then((r) =>
            r.slice(0, 10)
          ) as Promise<WeaponLite[]>;
      });
    } else return Promise.resolve(new Array<WeaponLite>());
  },
}));

export const filteredWeaponsAtom = atom(async (get) => {
  const weaponsLite = await get(weaponsLiteAtom);
  const searchInput = get(searchInputAtom);
  console.log(searchInput);

  return weaponsLite.filter((e) => e.name.toLowerCase().includes(searchInput));
});

export const categorisedWeaponsAtom = atom(async (get) => {
  const weapons = await get(filteredWeaponsAtom);
  const weaponCategoriser = get(weaponCategoriserAtom);
  const result = new Map<pain, WeaponLite[]>();
  for (const weapon of weapons) {
    for (const [_, categoriser] of weaponCategoriser) {
      const category = categoriser(weapon);
      if (category) {
        if (result.has(category))
          result.set(category, [...result.get(category)!, weapon]);
        else result.set(category, [weapon]);
      }
      continue;
    }
  }
  return result;
});

type NonRecordWeaponLite = {
  [key in NonRecordWeaponLiteProperties]: WeaponLite[key];
};

function categoriser<
  P extends NonRecordWeaponLiteProperties,
  T extends NonRecordWeaponLiteProperties
>(
  key: P,
  possibleProps: Array<FlattenArray<NonRecordWeaponLite[T]>>,
  weaponProperty: NonRecordWeaponLite[T]
) {
  let result: pain | undefined;
  if (weaponProperty instanceof Array) {
    for (const prop of possibleProps) {
      if (weaponProperty.includes(prop) && prop in reversedTypes[key]) {
        //@ts-ignore
        result = reversedTypes[key][prop];
      }
    }
  } else {
    for (const prop of possibleProps) {
      //@ts-ignore
      if (weaponProperty === prop) result = reversedTypes[key][prop];
    }
  }
  return result;
}

export type Flip<T extends Record<string | number, string | number>> = {
  [key in keyof T as T[key]]: key;
};

function flipper<T extends Record<string | number, string | number>>(
  objectToFlip: T
) {
  const entries = Object.entries(objectToFlip).map(
    ([key, value]) => [value as T[keyof T], key as keyof T] as const
  );
  return Object.fromEntries(entries) as Flip<T>;
}

export type AllWeaponPropertyHashes = {
  [key in NonRecordWeaponLiteProperties]: WeaponPropertyDefinitions<key>["propertyHashes"];
};
export const allWeaponPropertyHashes: AllWeaponPropertyHashes = {
  ammoType: ammoTypes.propertyHashes,
  defaultDamageType: defaultDamageTypes.propertyHashes,
  equipmentSlotTypeHash: equipmentSlotTypes.propertyHashes,
  tierTypeHash: tierTypes.propertyHashes,
  itemCategory: itemCategories.propertyHashes,
};

type ReversedWeaponCategoryHashes = {
  [key in Exclude<WeaponLiteFilterableProperties, "stats" | "perks">]: Flip<
    WeaponPropertyDefinitions<key>["propertyHashes"]
  >;
};
const reversedTypes: ReversedWeaponCategoryHashes = {
  ammoType: flipper(ammoTypes.propertyHashes),
  defaultDamageType: flipper(defaultDamageTypes.propertyHashes),
  equipmentSlotTypeHash: flipper(equipmentSlotTypes.propertyHashes),
  itemCategory: flipper(itemCategories.propertyHashes),
  tierTypeHash: flipper(tierTypes.propertyHashes),
};

// export function useWeaponFilter() {}

function useInputElement(
  inputElement: MutableRefObject<HTMLInputElement | null>
) {
  const [input, setInputState] = useState(
    inputElement && inputElement.current ? inputElement.current.value : ""
  );
  function setInput(newInput: string) {
    setInputState(newInput);
    if (inputElement && inputElement.current) {
      inputElement.current.value = newInput;
    }
  }
  return [input, setInput] as const;
}
