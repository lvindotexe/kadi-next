import {
  AllDestinyManifestComponents,
  DestinyInventoryItemDefinition,
} from "bungie-api-ts/destiny2";
import { FlattenArray } from "../hooks/search.js";
import { WeaponLite } from "./weaponTypes.js";

export type ArrayOfPrimitivesOrObject<T> = T extends Record<any, any>
  ? Map<keyof T, T[keyof T]>
  : T[];
type FilterableWeaponLite = Pick<
  WeaponLite,
  | "ammoType"
  | "defaultDamageType"
  | "equipmentSlotTypeHash"
  | "itemCategory"
  | "stats"
  | "perks"
  | "tierTypeHash"
>;
export type WeaponLiteFilterableProperties = keyof FilterableWeaponLite;
type NonRecordWeaponLiteProperties = Exclude<
  WeaponLiteFilterableProperties,
  "stats" | "perks"
>;
export type NonRecordWeaponLite = {
  [key in NonRecordWeaponLiteProperties]: WeaponLite[key];
};

export const weaponTierOneMasterwork = [
  518224747, 150943607, 1486919755, 4283235143, 2942552113, 1590375901,
  684616255, 4105787909, 4283235141, 2203506848, 0, 3928770367, 2674077375,
  915325363, 2357520979, 892374263, 3353797898, 150943605, 178753455, 654849177,
  1431498388, 199695019, 3444329767, 3689550782, 1590375903, 4105787911,
  1486919753,
];

export type DatabaseTables = {
  WeaponsLite: WeaponLite[];
  Ornaments: DestinyInventoryItemDefinition[];
  Weapons: DestinyInventoryItemDefinition[];
  Traits: DestinyInventoryItemDefinition[];
  MasterWork: DestinyInventoryItemDefinition[];
  Catalysts: DestinyInventoryItemDefinition[];
  WeaponMods: DestinyInventoryItemDefinition[];
  WeaponCategoryStatGroupMap: Record<number, number>;
} & Record<
  keyof AllDestinyManifestComponents,
  Array<
    AllDestinyManifestComponents[keyof AllDestinyManifestComponents][number]
  >
>;

export type FilterImplementation<T extends keyof WeaponLite> = (
  types: ArrayOfPrimitivesOrObject<FlattenArray<WeaponLite[T]>>,
  property: WeaponLite[T]
) => boolean;

export const defaultDamageTypes: WeaponPropertyDefinitions<"defaultDamageType"> =
  {
    propertyName: "defaultDamageType",
    propertyHashes: {
      kinetic: 3373582085,
      stasis: 151347233,
      solar: 1847026933,
      arc: 2303181850,
      void: 3454344768,
    },
    filterImplementation: (possibleprops, property) =>
      possibleprops.includes(property),
  };

export const equipmentSlotTypes: WeaponPropertyDefinitions<"equipmentSlotTypeHash"> =
  {
    propertyName: "equipmentSlotTypeHash",
    propertyHashes: {
      kinetic_slot: 1498876634,
      energy: 2465295065,
      heavy: 953998645,
    },
    filterImplementation: (possibleProps, property) =>
      possibleProps.includes(property),
  };

export const ammoTypes: WeaponPropertyDefinitions<"ammoType"> = {
  propertyName: "ammoType",
  propertyHashes: {
    primary: 1,
    special: 2,
    power: 3,
  },
  filterImplementation: (possibleprops, property) =>
    possibleprops.includes(property),
};

export const itemCategories: WeaponPropertyDefinitions<"itemCategory"> = {
  propertyName: "itemCategory",
  propertyHashes: {
    pulse_rifle: 7,
    hand_cannon: 6,
    glaive: 3871742104,
    trace_rifle: 2489664120,
    scout_rifle: 8,
    auto_rifle: 5,
    sword: 54,
    rocket: 13,
    submachine_gun: 3954685534,
    machine_gun: 12,
    sidearm: 14,
    shotgun: 11,
    sniper_rifle: 10,
    grenade_launcher: 153950757,
    bow: 3317538576,
    fusion_rifle: 9,
    linear_fusion_rifle: 1504945536,
  },
  filterImplementation: (properties, property) =>
    properties.some((e) => property.includes(e)),
};

export const tierTypes: WeaponPropertyDefinitions<"tierTypeHash"> = {
  propertyName: "tierTypeHash",
  propertyHashes: {
    //basic: 0,
    //otherBasic: 3340296461,
    rare: 2127292149,
    common: 2395677314,
    exotic: 2759499571,
    // otherOtherBasic: 1801258597,
    legendary: 4008398120,
  },
  filterImplementation: (possibleProps, property) =>
    possibleProps.includes(property),
};

export type WeaponLiteFilterStrategies = Partial<{
  [key in WeaponLiteFilterableProperties]: WeaponPropertyDefinitions<key>;
}>;

export type WeaponPropertyDefinitions<T extends keyof WeaponLite> = {
  filterImplementation: FilterImplementation<T>;
  // impossibleCombinations: T extends NonRecordWeaponLiteProperties
  //   ? Partial<
  //       Record<
  //         keyof WeaponPropertyDefinitions<T>["propertyHashes"],
  //         {
  //           [key in keyof WeaponLiteFilterStrategies]: Array<
  //             WeaponPropertyDefinitions<key>["propertyHashes"][keyof WeaponPropertyDefinitions<key>["propertyHashes"]]
  //           >;
  //         }
  //       >
  //     >
  //   : undefined;
  propertyHashes: T extends NonRecordWeaponLiteProperties
    ? "ammoType" extends T
      ? typeof ammoTypeHashes
      : "defaultDamageType" extends T
      ? typeof damagetypesHashes
      : "equipmentSlotTypeHash" extends T
      ? typeof equipmentSlotHashes
      : "itemCategory" extends T
      ? typeof itemCategoryHashes
      : "tierTypeHash" extends T
      ? typeof tierTypeHashes
      : never
    : undefined;
} & { propertyName: T };

export type AllWeaponPropertyDefinitions = {
  [key in NonRecordWeaponLiteProperties]: WeaponPropertyDefinitions<key>;
};
export const allWeaponPropertyDefinitions: AllWeaponPropertyDefinitions = {
  ammoType: ammoTypes,
  defaultDamageType: defaultDamageTypes,
  equipmentSlotTypeHash: equipmentSlotTypes,
  tierTypeHash: tierTypes,
  itemCategory: itemCategories,
};

const damagetypesHashes = {
  kinetic: 3373582085,
  stasis: 151347233,
  solar: 1847026933,
  arc: 2303181850,
  void: 3454344768,
} as const;

const equipmentSlotHashes = {
  kinetic_slot: 1498876634,
  energy: 2465295065,
  heavy: 953998645,
} as const;

const ammoTypeHashes = {
  primary: 1,
  special: 2,
  power: 3,
} as const;

const itemCategoryHashes = {
  pulse_rifle: 7,
  hand_cannon: 6,
  glaive: 3871742104,
  trace_rifle: 2489664120,
  scout_rifle: 8,
  auto_rifle: 5,
  sword: 54,
  rocket: 13,
  submachine_gun: 3954685534,
  machine_gun: 12,
  sidearm: 14,
  shotgun: 11,
  sniper_rifle: 10,
  grenade_launcher: 153950757,
  bow: 3317538576,
  fusion_rifle: 9,
  linear_fusion_rifle: 1504945536,
} as const;

export const tierTypeHashes = {
  //basic: 0,
  //otherBasic: 3340296461,
  rare: 2127292149,
  common: 2395677314,
  exotic: 2759499571,
  // otherOtherBasic: 1801258597,
  legendary: 4008398120,
} as const;

export const basicStatDefinitions = [
  {
    hash: 16120457,
    name: "Void Energy Capacity",
  },
  {
    hash: 144602215,
    name: "Intellect",
  },
  {
    hash: 155624089,
    name: "Stability",
  },
  {
    hash: 392767087,
    name: "Resilience",
  },
  {
    hash: 447667954,
    name: "Draw Time",
  },
  {
    hash: 514071887,
    name: "Mod Cost",
  },
  {
    hash: 925767036,
    name: "Ammo Capacity",
  },
  {
    hash: 943549884,
    name: "Handling",
  },
  {
    hash: 1240592695,
    name: "Range",
  },
  {
    hash: 1345609583,
    name: "Aim Assistance",
  },
  {
    hash: 1546607977,
    name: "Heroic Resistance",
  },
  {
    hash: 1546607978,
    name: "Arc Damage Resistance",
  },
  {
    hash: 1546607979,
    name: "Solar Damage Resistance",
  },
  {
    hash: 1546607980,
    name: "Void Damage Resistance",
  },
  {
    hash: 1591432999,
    name: "Accuracy",
  },
  {
    hash: 1735777505,
    name: "Discipline",
  },
  {
    hash: 1842278586,
    name: "Shield Duration",
  },
  {
    hash: 1931675084,
    name: "Inventory Size",
  },
  {
    hash: 1943323491,
    name: "Recovery",
  },
  {
    hash: 2018193158,
    name: "Solar Energy Capacity",
  },
  {
    hash: 2523465841,
    name: "Velocity",
  },
  {
    hash: 2715839340,
    name: "Recoil Direction",
  },
  {
    hash: 2961396640,
    name: "Charge Time",
  },
  {
    hash: 2996146975,
    name: "Mobility",
  },
  {
    hash: 3555269338,
    name: "Zoom",
  },
  {
    hash: 3578062600,
    name: "Any Energy Type Cost",
  },
  {
    hash: 3614673599,
    name: "Blast Radius",
  },
  {
    hash: 3625423501,
    name: "Arc Energy Capacity",
  },
  {
    hash: 3871231066,
    name: "Magazine",
  },
  {
    hash: 3950461274,
    name: "Stasis Cost",
  },
  {
    hash: 4043523819,
    name: "Impact",
  },
  {
    hash: 4188031367,
    name: "Reload Speed",
  },
  {
    hash: 4244567218,
    name: "Strength",
  },
];
