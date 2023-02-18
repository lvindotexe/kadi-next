import {
  DestinyInventoryItemDefinition,
  DestinyStatDefinition,
  DestinyPlugSetDefinition,
  DestinyStatGroupDefinition,
  DestinySandboxPerkDefinition,
} from "bungie-api-ts/destiny2";
import { WeaponLite } from "./weaponTypes.js";

export const weaponTierOneMasterwork = [
  518224747, 150943607, 1486919755, 4283235143, 2942552113, 1590375901,
  684616255, 4105787909, 4283235141, 2203506848, 0, 3928770367, 2674077375,
  915325363, 2357520979, 892374263, 3353797898, 150943605, 178753455, 654849177,
  1431498388, 199695019, 3444329767, 3689550782, 1590375903, 4105787911,
  1486919753,
];

export type DatabaseTables = {
  WeaponLite: WeaponLite[];
  Ornaments: DestinyInventoryItemDefinition[];
  Weapons: DestinyInventoryItemDefinition[];
  Traits: DestinyInventoryItemDefinition[];
  MasterWork: DestinyInventoryItemDefinition[];
  Catalysts: DestinyInventoryItemDefinition[];
  DestinyStatDefinition: DestinyStatDefinition[];
  DestinyPlugSetDefinition: DestinyPlugSetDefinition[];
  DestinyStatGroupDefinition: DestinyStatGroupDefinition[];
  WeaponMods: DestinyInventoryItemDefinition[];
  DestinySandboxPerkDefinition: DestinySandboxPerkDefinition[];
  WeaponCategoryStatGroupMap: Map<number, number>;
};

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

export const damageTypes = {
  kinetic: 3373582085,
  stasis: 151347233,
  solar: 1847026933,
  arc: 2303181850,
  void: 3454344768,
} as const;
export const equipmentSlotType = {
  primary: 1498876634,
  energy: 2465295065,
  power: 953998645,
} as const;

export const ammoType = {
  primary: 1,
  special: 2,
  power: 3,
} as const;

export const archeType = {
  pulse: 7,
  handcannon: 6,
  glaives: 3871742104,
  trace: 2489664120,
  scout: 8,
  autotrifle: 5,
  sword: 54,
  rocket: 13,
  submachine: 3954685534,
  machinegun: 12,
  sidearm: 14,
  shotgun: 11,
  sniper: 10,
  grenadelaunchers: 153950757,
  bows: 3317538576,
  fusion: 9,
  linear: 1504945536,
} as const;

export const tiertype = {
  //basic: 0,
  //otherBasic: 3340296461,
  rare: 2127292149,
  common: 2395677314,
  exotic: 2759499571,
  // otherOtherBasic: 1801258597,
  legendary: 4008398120,
};
