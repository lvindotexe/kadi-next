import {
  DestinyInventoryItemDefinition,
  DestinyStatDefinition,
  DestinyStatGroupDefinition,
  DestinyPlugSetDefinition,
  DestinySandboxPerkDefinition,
  DestinyItemSocketBlockDefinition,
} from "bungie-api-ts/destiny2";
import { weaponTierOneMasterwork } from "../types/types.js";
import {
  SocketMod,
  Catalyst,
  getInvestmentStatsLite,
  MasterWork,
  Mod,
  Ornament,
  Trait,
  Weapon,
} from "./transformWeaponLite.js";
import { isAdept, isNotNullOrUndefined } from "./utils.js";

export function getCatalyst(
  item: DestinyInventoryItemDefinition,
  catalysts: DestinyInventoryItemDefinition[],
  masterworks: DestinyInventoryItemDefinition[],
  statDefs: DestinyStatDefinition[]
): SocketMod<Catalyst> | null {
  const entry = filteredSocketEntries(item.sockets, 2685412949).filter(
    (e) => e.reusablePlugItems.length > 0
  )[0];
  if (entry == null) return null;
  const reusablePlugItemHashes = entry.reusablePlugItems.map(
    (plugItem) => plugItem.plugItemHash
  );

  const catalyst = catalysts.filter((cat) =>
    reusablePlugItemHashes.includes(cat.hash)
  )[0];
  const masterwork: DestinyInventoryItemDefinition | undefined =
    masterworks.filter((e) => reusablePlugItemHashes.includes(e.hash))[0];

  if (!catalyst || !masterwork) return null;
  const placeholder = catalysts.find(
    (e) => e.hash == entry.singleInitialItemHash
  );
  if (!placeholder) throw "no placeholder item";
  const pain: SocketMod<Catalyst> = {
    placeholder: {
      description: placeholder.displayProperties.description,
      kind: "placeholder Catalyst",
      icon: placeholder.displayProperties.icon,
      hash: placeholder.hash,
      investmentStats: [],
    },
    items: [
      {
        kind: "Catalyst",
        description: catalyst.displayProperties.description,
        name: catalyst.displayProperties.name,
        hash: catalyst.hash,
        investmentStats: [
          ...getInvestmentStatsLite(catalyst, statDefs).values(),
        ],
        icon: catalyst.displayProperties.icon,
      },
    ],
  };
  return pain;
}

export function getMasterWork(
  //TODO write test for blues to exotic
  item: DestinyInventoryItemDefinition,
  masterworks: DestinyInventoryItemDefinition[],
  statDefs: DestinyStatDefinition[],
  statGroups: DestinyStatGroupDefinition[]
): null | SocketMod<MasterWork> {
  const entry = filteredSocketEntries(item.sockets, 2685412949).filter(
    (entry) => weaponTierOneMasterwork.includes(entry.singleInitialItemHash)
  )[0];
  if (!entry) return null;
  const masterworkHashes = entry.reusablePlugItems.map((e) => e.plugItemHash);
  if (masterworkHashes.length < 1) return null;
  masterworks =
    masterworkHashes.length == 0
      ? masterworks.filter((mw) => mw.hash == entry.singleInitialItemHash)
      : masterworks.filter(
          (mw) =>
            masterworkHashes.includes(mw.hash) ||
            mw.hash == entry.singleInitialItemHash
        );
  const placeholder = masterworks
    .filter((mw) => mw.hash == entry.singleInitialItemHash)
    .map((e): SocketMod<MasterWork>["placeholder"] => {
      return {
        icon: e.displayProperties.icon,
        description: e.displayProperties.description,
        hash: e.hash,
        kind: "placeholder Masterwork",
        investmentStats: [],
      };
    })[0];
  const items = masterworks
    .filter((mw) => mw.displayProperties.name == "Masterwork")
    .filter((mw) => {
      const maxIndex = mw.investmentStats.indexOf(
        mw.investmentStats.filter((e) => e.value == 10)[0]!
      );
      return item.investmentStats
        .map((e) => e.statTypeHash)
        .includes(mw.investmentStats[maxIndex]!.statTypeHash);
    })
    .map((mw): MasterWork => {
      return {
        name: mw.displayProperties.name,
        description: mw.displayProperties.description,
        hash: mw.hash,
        kind: "Masterwork",
        icon: mw.displayProperties.icon,
        watermark: mw.iconWatermark,
        investmentStats: isAdept(item.displayProperties.name)
          ? [...getInvestmentStatsLite(mw, statDefs).values()]
          : [...getInvestmentStatsLite(mw, statDefs).values()].filter(
              (e) => e.value === 10
            ),
      };
    });

  return {
    placeholder:
      placeholder == undefined
        ? {
            description: items[0]!.description,
            icon: "/common/destiny2_content/icons/b4d05ef69d0c3227a7d4f7f35bbc2848.png",
            hash: 0,
            kind: "placeholder Masterwork",
            investmentStats: [],
          }
        : placeholder,
    items,
  };
}

export function getMods(
  item: DestinyInventoryItemDefinition,
  weaponMods: DestinyInventoryItemDefinition[],
  plugSetDefs: DestinyPlugSetDefinition[],
  statDefs: DestinyStatDefinition[],
  sandboxPerks: DestinySandboxPerkDefinition[]
): null | SocketMod<Mod> {
  //TODO remove regex
  if (item.itemTypeAndTierDisplayName.toLocaleLowerCase().match(/^exotic/))
    return null;
  const entry = filteredSocketEntries(item.sockets, 2685412949).filter(
    (entry) => entry.singleInitialItemHash == 2323986101
  )[0];
  if (!entry) return null;
  const allMods = entry.reusablePlugItems
    ? getPlugItems(entry.reusablePlugSetHash!, plugSetDefs, weaponMods)
    : undefined;
  if (!allMods) return null;
  //gets "empty mod socket" mod
  const placeholder = allMods.filter((mod) => mod.hash == 2323986101)[0];
  //TODO config for harrowed/adept/timelost
  const filteredMods = item.displayProperties.name
    .toLocaleLowerCase()
    .match(/\(adept|timelost\)$/)
    ? allMods.flat().reverse()
    : allMods
        .flat()
        .filter(
          (mod) => !mod.displayProperties.name.toLowerCase().match(/adept/)
        );

  const items = filteredMods
    .filter((mod) => mod.hash != placeholder?.hash)
    .map((mod): Mod => {
      const perk = sandboxPerks.filter(
        (e) => e.hash === mod.perks[0]?.perkHash
      )[0];
      return {
        name: mod.displayProperties.name,
        hash: mod.hash,
        description: perk!.displayProperties.description,
        kind: "Mod",
        icon: mod.displayProperties.icon,
        investmentStats: [...getInvestmentStatsLite(mod, statDefs).values()],
      };
    });

  return {
    placeholder: {
      description: placeholder!.displayProperties.description,
      icon: placeholder!.displayProperties.icon,
      kind: "placeholder Mod",
      hash: placeholder!.hash,
      investmentStats: [],
    },
    items: isAdept(item.displayProperties.name)
      ? items
      : items.filter((e) => !e.name.toLowerCase().includes("adept")),
  };
}

export function getOrnaments(
  item: DestinyInventoryItemDefinition,
  plugsets: DestinyPlugSetDefinition[],
  ornaments: DestinyInventoryItemDefinition[]
): null | SocketMod<Ornament> {
  const entry = filteredSocketEntries(item.sockets, 2048875504).filter(
    (entry) => entry.singleInitialItemHash != 4248210736
  )[0];
  if (!entry || !entry.reusablePlugSetHash) return null;
  const items = getPlugItems(
    entry.reusablePlugSetHash,
    plugsets,
    ornaments
  ).map((ornament): Ornament => {
    return {
      kind: "Ornament",
      description: ornament.displayProperties.description,
      hash: ornament.hash,
      icon: ornament.displayProperties.icon,
      screenshot: ornament.screenshot,
      name: ornament.displayProperties.name,
      flavourText: item.flavorText,
    };
  });
  return {
    placeholder: {
      description: items[0]!.description,
      kind: "placeholder Ornament",
      hash: items[0]!.hash,
      icon: items[0]!.icon,
      investmentStats: [],
    },
    items: items.slice(1),
  };
}

function getPerkSets(
  item: DestinyInventoryItemDefinition,
  plugSets: DestinyPlugSetDefinition[],
  weaponMods: DestinyInventoryItemDefinition[]
) {
  return filteredSocketEntries(item.sockets, 4241085061)
    .filter((entry) => entry.singleInitialItemHash != 2285418970)
    .map((entry) => entry?.randomizedPlugSetHash || entry?.reusablePlugSetHash)
    .map((setHash) => getPlugItems(setHash!, plugSets, weaponMods));
}

export function getPerkHashes(
  item: DestinyInventoryItemDefinition,
  plugSets: DestinyPlugSetDefinition[],
  weaponMods: DestinyInventoryItemDefinition[]
) {
  return getPerkSets(item, plugSets, weaponMods).flatMap((set) =>
    set.map((perk) => perk.hash)
  );
}

type Perks = Weapon["perks"];

export function getDetailedPerkSets(
  item: DestinyInventoryItemDefinition,
  plugSets: DestinyPlugSetDefinition[],
  weaponMods: DestinyInventoryItemDefinition[],
  statDefs: DestinyStatDefinition[]
): Weapon["perks"] {
  return getPerkSets(item, plugSets, weaponMods)
    .filter((set) => set.length > 0)
    .map((set) => ({
      type: set[0]!.itemTypeDisplayName,
      items: Object.fromEntries(
        set.reduce(
          (acc, e) =>
            acc.set(e.hash, {
              description: e.displayProperties.description,
              hash: e.hash,
              icon: e.displayProperties.icon,
              investmentStats: [
                ...getInvestmentStatsLite(e, statDefs).values(),
              ],
              kind: "Trait",
              name: e.displayProperties.name,
              currentlyCanRoll: e.currentlyCanRoll,
            }),
          new Map<number, Trait>()
        )
      ),
    }));
}

export function getIntrinsicTrait(
  item: DestinyInventoryItemDefinition,
  weaponMods: DestinyInventoryItemDefinition[]
) {
  const entry = filteredSocketEntries(item.sockets, 3956125808)[0];
  const intrinsicHash = entry?.singleInitialItemHash;
  const mod = weaponMods.filter((mod) => mod.hash == intrinsicHash)[0];
  return {
    name: mod!.displayProperties.name,
    icon: mod!.displayProperties.icon,
    description: mod!.displayProperties.description,
  } as Weapon["intrinsic"];
}

const filteredSocketEntries = (
  sockets: DestinyItemSocketBlockDefinition | undefined,
  socketCategory: number
) => {
  if (!sockets)
    throw "incompatible item: missing DestinyItemSocketBlockDefinition";
  return sockets.socketCategories
    .filter((category) => category.socketCategoryHash == socketCategory)
    .flatMap((category) => category.socketIndexes)
    .map((index) => sockets.socketEntries[index])
    .filter(isNotNullOrUndefined);
};

function getPlugItems(
  plugSetHash: number,
  plugSetDefinitions: DestinyPlugSetDefinition[],
  hayStackDefinitionTable: DestinyInventoryItemDefinition[]
) {
  return plugSetDefinitions
    .filter((plugSetDefinition) => plugSetDefinition.hash == plugSetHash)
    .flatMap((plugSet) => {
      return plugSet.reusablePlugItems
        .map((item) => {
          const mod = hayStackDefinitionTable.filter(
            (mod: DestinyInventoryItemDefinition) =>
              mod.hash == item.plugItemHash
          )[0];
          if (mod) return { ...mod, currentlyCanRoll: item.currentlyCanRoll };
          return;
        })
        .filter(isNotNullOrUndefined);
    });
}
