import {
  DestinyItemInvestmentStatDefinition,
  DestinyInventoryItemDefinition,
  DestinyStatDefinition,
  DestinyStatGroupDefinition,
  InterpolationPoint,
} from "bungie-api-ts/destiny2";
import { isNotNullOrUndefined } from "./utils.js";

type BaseItem = {
  name: string;
  hash: number;
};

export type WeaponSocketModKind = "Catalyst" | "Mod" | "Masterwork" | "Trait";
export type WeaponSocketMod<T extends WeaponSocketModKind> = BaseItem & {
  kind: T;
  icon: string;
  description: string;
  investmentStats: Weapon["investmentStats"] extends Map<number, infer U>
    ? Omit<U, "displayInterpolation">[]
    : never;
};

export type Catalyst = WeaponSocketMod<"Catalyst">;
export type Mod = WeaponSocketMod<"Mod">;
export type Trait = WeaponSocketMod<"Trait"> & { currentlyCanRoll: boolean };
export type MasterWork = WeaponSocketMod<"Masterwork"> & { watermark: string };

export type Ornament = BaseItem & {
  kind: "Ornament";
  screenshot: string;
  icon: string;
  description: string;
  flavourText: string;
};

export type SocketMod<T extends Ornament | Mod | MasterWork | Catalyst> = {
  placeholder: {
    description: string;
    kind: `placeholder ${T["kind"]}`;
    icon: string;
    hash: number | 1;
    investmentStats: [];
  };
  items: T[];
};

export type WeaponLite = BaseItem & {
  investmentStats: Weapon["investmentStats"];
  kind: "weaponLite";
  icon: string;
  collectibleHash: number;
  iconWatermark: string;
  iconWatermarkShelved: string;
  flavourText: string;
  tierTypeHash: number;
  itemTypeAndTierDisplayName: string;
  perks: number[];
  equipmentSlotTypeHash: number;
  ammoType: number;
  summaryItemHash: number;
  defaultDamageType: number;
  itemCategory: number[];
  stats: Map<number, number>;
};

//TODO itemtype,exotic legendary etc
export type Weapon = BaseItem & {
  screenshot: string;
  intrinsic: {
    name: string;
    icon: string;
    description: string;
  };
  perks: {
    type: string;
    items: Map<number, Trait>;
  }[];
  icon: string;
  iconWatermark: string;
  iconWatermarkShelved: string;
  flavourText: string;
  itemTypeAndTierDisplayName: string;
  investmentStats: Map<
    number,
    {
      displayInterpolation: InterpolationPoint[];
      name: string;
      description: string;
    } & DestinyItemInvestmentStatDefinition
  >;
  sockets: {
    catalyst: SocketMod<Catalyst> | null;
    mod: SocketMod<Mod> | null;
    masterwork: SocketMod<MasterWork> | null;
    ornament: SocketMod<Ornament> | null;
  };
};

export function getInvestmentStatsLite(
  item: DestinyInventoryItemDefinition,
  statDefs: DestinyStatDefinition[]
) {
  const investmentStats = item.investmentStats.map((e) => e.statTypeHash);
  const filteredStatDefinitions = new Map(
    statDefs
      .filter((def) => investmentStats.includes(def.hash))
      .map((def) => [def.hash, def] as const)
  );
  const results = item.investmentStats
    .map((e) => {
      if (!filteredStatDefinitions.has(e.statTypeHash)) return;
      const statDef = filteredStatDefinitions.get(e.statTypeHash)!;
      return [
        e.statTypeHash,
        {
          ...e,
          name: statDef.displayProperties.name,
          description: statDef.displayProperties.description,
        },
      ] as const;
    })
    .filter(isNotNullOrUndefined);
  return new Map(results);
}

export function getInvestmentStatsLiteWithDisplayInterpolation(
  item: DestinyInventoryItemDefinition,
  statDefs: DestinyStatDefinition[],
  statGroups: DestinyStatGroupDefinition[]
) {
  const investmentStats = getInvestmentStatsLite(item, statDefs);
  const results = statGroups
    .filter((e) => item.stats?.statGroupHash === e.hash)
    .flatMap((g) => g.scaledStats)
    .map((e) => {
      const invStat = investmentStats.get(e.statHash);
      return invStat
        ? ([
            e.statHash,
            { ...invStat, displayInterpolation: e.displayInterpolation },
          ] as const)
        : null;
    })
    .filter(isNotNullOrUndefined);
  return new Map(results);
}
