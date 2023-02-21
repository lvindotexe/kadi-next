import {
  DestinyItemInvestmentStatDefinition,
  InterpolationPoint,
} from "bungie-api-ts/destiny2";

type BaseItem = {
  name: string;
  hash: number;
};

export type WeaponSocketModKind = "Catalyst" | "Mod" | "Masterwork" | "Trait";
export type WeaponSocketMod<T extends WeaponSocketModKind> = BaseItem & {
  kind: T;
  icon: string;
  description: string;
  investmentStats: Weapon["investmentStats"] extends Record<number, infer U>
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
  stats: Record<number, number>;
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
    items: Record<number, Trait>;
  }[];
  icon: string;
  iconWatermark: string;
  iconWatermarkShelved: string;
  flavourText: string;
  itemTypeAndTierDisplayName: string;
  investmentStats: Record<
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
