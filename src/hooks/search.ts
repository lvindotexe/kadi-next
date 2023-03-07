import { getDestinyManifest } from "bungie-api-ts/destiny2";
import { get as idbGet } from "idb-keyval";
import { atom } from "jotai";
import { atomsWithQuery } from "jotai-tanstack-query";
import { fetchAndCache, generateHttpClient, notFetch } from "../lib/utils";
import {
  AllWeaponPropertyDefinitions,
  allWeaponPropertyDefinitions,
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
  for (const [key, categories] of [...selectedCategories.entries()].filter(
    ([k, v]) => v.size > 0
  )) {
    result.set(key, (weapon: WeaponLite) =>
      categoriser(key, Array.from(categories), weapon[key])
    );
  }
  return result;
});

export const weaponFiltersAtom = atom((get) => {
  const selectedCategories = [...get(selectedCategoriesAtom).entries()].filter(
    ([_, v]) => v.size > 0
  );
  const result = new Map<NonRecordWeaponLiteProperties, FilterFunction>();
  for (const [key, categories] of selectedCategories) {
    const weaponPropertyDefinition = allWeaponPropertyDefinitions[key];
    if ("filterImplementation" in weaponPropertyDefinition) {
      const filterFn = (weapon: WeaponLite) =>
        weaponPropertyDefinition.filterImplementation(
          Array.from(categories),
          weapon[key]
        );
      result.set(key, filterFn);
    }
  }
  console.log({ result, selectedCategories });
  return result;
});

function getInitialData() {
  return idbGet("version").then((version) => {
    if (!version) {
      return notFetch<string>("/api/version").then(() =>
        notFetch<WeaponLite[]>("/api/WeaponsLite")
      );
    } else if (version) {
      const httpClient = generateHttpClient(
        fetch,
        "d1f18c12540e4df3b1cea9ee418fb234"
      );
      return getDestinyManifest(httpClient)
        .then((response) => response.Response.version === version)
        .then((isUptoDate) => {
          if (!isUptoDate)
            return fetchAndCache<WeaponLite[]>(
              "/api/WeaponsLite",
              "weaponsLite"
            );
          else return idbGet<WeaponLite[]>("weaponsLite");
        });
    }
  });
}

export const weaponsLiteAtom = atom(
  new Array<WeaponLite>(),
  (get, set, weapons: WeaponLite[]) => {
    set(weaponsLiteAtom, weapons);
  }
);

export const filteredWeaponsAtom = atom(async (get) => {
  const weaponsLite = await get(weaponsLiteAtom);
  const weaponFiters = [...get(weaponFiltersAtom).values()];
  const searchInput = get(searchInputAtom);
  const hasFilters =
    weaponFiters.length > 0 && [...weaponFiters.values()].every((e) => !!e);
  return weaponsLite.filter((e) =>
    hasFilters
      ? e.name.toLowerCase().includes(searchInput) &&
        weaponFiters.every((fn) => fn(e))
      : e.name.toLowerCase().includes(searchInput)
  );
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
      if (
        weaponProperty.includes(prop) &&
        prop in reversedWeaponPropertyHashes[key]
      ) {
        //@ts-ignore
        result = reversedWeaponPropertyHashes[key][prop];
      }
    }
  } else {
    for (const prop of possibleProps) {
      //@ts-ignore
      if (weaponProperty === prop)
        result = reversedWeaponPropertyHashes[key][prop];
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

type AllWeaponPropertyHashes = {
  [key in keyof AllWeaponPropertyDefinitions]: AllWeaponPropertyDefinitions[key]["propertyHashes"];
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
export const reversedWeaponPropertyHashes: ReversedWeaponCategoryHashes = {
  ammoType: flipper(ammoTypes.propertyHashes),
  defaultDamageType: flipper(defaultDamageTypes.propertyHashes),
  equipmentSlotTypeHash: flipper(equipmentSlotTypes.propertyHashes),
  itemCategory: flipper(itemCategories.propertyHashes),
  tierTypeHash: flipper(tierTypes.propertyHashes),
};
