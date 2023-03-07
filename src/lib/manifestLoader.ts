import {
  DestinyInventoryItemDefinition,
  DestinyPlugSetDefinition,
  DestinyStatGroupDefinition,
  DestinyStatDefinition,
  DestinySandboxPerkDefinition,
  getDestinyManifest,
  AllDestinyManifestComponents,
  DestinyManifest,
  getDestinyManifestComponent,
} from "bungie-api-ts/destiny2";
import { HttpClientConfig } from "bungie-api-ts/http";
import { Weapon, WeaponLite } from "../types/weaponTypes.js";
import {
  getIntrinsicTrait,
  getDetailedPerkSets,
  getCatalyst,
  getMods,
  getMasterWork,
  getOrnaments,
  getPerkHashes,
} from "./socketTransformer.js";
import { getInvestmentStatsLiteWithDisplayInterpolation } from "./transformWeaponLite.js";

type TransformedTableNames =
  | "MasterWork"
  | "Catalysts"
  | "WeaponMods"
  | "Ornaments"
  | "Weapons"
  | "Traits"
  | "WeaponLite";
type CategorisedItems = Map<
  TransformedTableNames,
  DestinyInventoryItemDefinition[]
>;

type ToArray<T> = T extends any ? T[] : never;

function transformWeapon(
  item: DestinyInventoryItemDefinition,
  catItems: CategorisedItems,
  plugSets: DestinyPlugSetDefinition[],
  statGroups: DestinyStatGroupDefinition[],
  statDefs: DestinyStatDefinition[],
  sandboxPerks: DestinySandboxPerkDefinition[]
): Weapon {
  const [masterworks, catalysts, weaponMods, ornaments] = [
    catItems.get("MasterWork")!,
    catItems.get("Catalysts")!,
    catItems.get("WeaponMods")!,
    catItems.get("Ornaments")!,
  ];
  return {
    name: item.displayProperties.name,
    icon: item.displayProperties.icon,
    iconWatermark: item.iconWatermark,
    intrinsic: getIntrinsicTrait(item, weaponMods),
    perks: getDetailedPerkSets(item, plugSets, weaponMods, statDefs),
    iconWatermarkShelved: item.iconWatermarkShelved,
    flavourText: item.flavorText,
    itemTypeAndTierDisplayName: item.itemTypeAndTierDisplayName,
    hash: item.hash,
    screenshot: item.screenshot,
    investmentStats: getInvestmentStatsLiteWithDisplayInterpolation(
      item,
      statDefs,
      statGroups
    ),
    sockets: {
      catalyst: getCatalyst(item, catalysts, masterworks, statDefs),
      mod: getMods(item, weaponMods, plugSets, statDefs, sandboxPerks),
      masterwork: getMasterWork(item, masterworks, statDefs, statGroups),
      ornament: getOrnaments(item, plugSets, ornaments),
    },
  };
}

function transformWeaponLite(
  item: DestinyInventoryItemDefinition,
  catItems: CategorisedItems,
  plugSets: DestinyPlugSetDefinition[],
  statGroups: DestinyStatGroupDefinition[],
  statDefs: DestinyStatDefinition[]
): WeaponLite {
  const mods = catItems.get("WeaponMods")!;

  return {
    kind: "weaponLite",
    investmentStats: getInvestmentStatsLiteWithDisplayInterpolation(
      item,
      statDefs,
      statGroups
    ),
    hash: item.hash,
    name: item.displayProperties.name,
    icon: item.displayProperties.icon,
    collectibleHash: item.collectibleHash!,
    iconWatermark: item.iconWatermark,
    iconWatermarkShelved: item.iconWatermarkShelved,
    flavourText: item.flavorText,
    tierTypeHash: item.inventory!.tierTypeHash,
    itemTypeAndTierDisplayName: item.itemTypeAndTierDisplayName,
    equipmentSlotTypeHash: item.equippingBlock!.equipmentSlotTypeHash,
    ammoType: item.equippingBlock!.ammoType,
    summaryItemHash: item.summaryItemHash!,
    defaultDamageType: item.defaultDamageTypeHash!,
    itemCategory: item.itemCategoryHashes!,
    stats: Object.fromEntries(
      item.investmentStats.map((e) => [e.statTypeHash, e.value] as const)
    ),
    perks: getPerkHashes(item, plugSets, mods),
  };
}

function generateHttpClient(fetchLike: typeof fetch, apiKey: string) {
  return function <T>(config: HttpClientConfig) {
    return fetchLike(config.url, {
      ...config,
      body: config.body,
      headers: { "X-API-Key": apiKey },
    }).then((response) => {
      if (!response.ok) {
        throw new Error("unable to fetch manifest", { cause: response });
      }
      return response.json() as T;
    });
  };
}

const httpClient = generateHttpClient(
  fetch,
  "d1f18c12540e4df3b1cea9ee418fb234"
);

function getManifestMetaData() {
  // return getDestinyManifest(httpClient).then((r) => r.Response);
  return getDestinyManifest(httpClient).then((r) => {
    return r.Response;
  });
}

function fetchManifestTables<T extends keyof AllDestinyManifestComponents>(
  tables: T[],
  manifest: DestinyManifest
) {
  return tables
    .map((table) =>
      getDestinyManifestComponent(httpClient, {
        destinyManifest: manifest,
        language: "en",
        tableName: table,
      })
    )
    .reduce(async (acc, curr, index) => {
      const [map, manifestComponent] = await Promise.all([acc, curr]);
      //@ts-ignore weird type inference
      return map.set(tables[index], Object.values(manifestComponent));
    }, Promise.resolve(new Map<T, ToArray<AllDestinyManifestComponents[T][number]>>()));
}

export function loadManifest() {
  return getManifestMetaData()
    .then((result) =>
      fetchManifestTables(
        [
          "DestinyInventoryItemDefinition",
          "DestinyActivityDefinition",
          "DestinyPlugSetDefinition",
          "DestinyStatDefinition",
          "DestinyStatGroupDefinition",
          "DestinySandboxPerkDefinition",
        ],
        result
      )
    )
    .then((results) => {
      const itemDefs = results.get(
        "DestinyInventoryItemDefinition"
      )! as DestinyInventoryItemDefinition[];

      const categorisedItems = new Map<
        TransformedTableNames,
        DestinyInventoryItemDefinition[]
      >();

      function categoriseItem(
        tableName: TransformedTableNames,
        item: DestinyInventoryItemDefinition
      ) {
        categorisedItems.get(tableName) === undefined
          ? categorisedItems.set(tableName, [item])
          : categorisedItems.get(tableName)!.push(item);
      }

      for (const [_, item] of Object.entries(itemDefs)) {
        //filters uncategorised items
        if (!item.itemCategoryHashes) continue;
        //sets ornaments
        if (
          item.itemCategoryHashes.includes(3124752623) ||
          item.itemSubType == 21 ||
          item.itemSubType == 20
        ) {
          categoriseItem("Ornaments", item);
          continue;
        }
        //sets weapons
        if (
          !item.itemCategoryHashes.includes(3109687656) &&
          item.itemCategoryHashes.includes(1)
        ) {
          categoriseItem("Weapons", item);
          continue;
        }
        //normal mods
        if (item.itemCategoryHashes.includes(610365472)) {
          categoriseItem("WeaponMods", item);
          continue;
        }
        //sets traits
        if (
          (item.itemTypeAndTierDisplayName &&
            item.itemTypeAndTierDisplayName.length > 0 &&
            item.itemTypeAndTierDisplayName.toLowerCase().match(/trait$/)) ||
          item.itemTypeAndTierDisplayName
            .toLocaleLowerCase()
            .match(/intrinsic$/) ||
          //checks if the traits are intrinsic
          item.itemCategoryHashes.includes(2237038328)
        ) {
          categoriseItem("Traits", item);
          continue;
        }
        //sets masterwork tiers
        if (
          item.plug?.plugCategoryIdentifier
            .toLocaleLowerCase()
            .includes("masterwork")
        ) {
          categoriseItem("MasterWork", item);
        }

        if (
          item.traitIds?.some((e) => e.includes("exotic_catalyst")) ||
          item.plug?.plugCategoryIdentifier.includes("exotic.masterwork") ||
          item.displayProperties.name.toLocaleLowerCase().match(/catalyst$/)
        ) {
          categoriseItem("Catalysts", item);
          continue;
        }
      }
      return [results, categorisedItems] as const;
    })
    .then(([manifestTables, categorisedItems]) => {
      const weapons = categorisedItems.get("Weapons")!;
      const [statGroups, statDefs, plugSets, sandboxPerks] = [
        manifestTables.get(
          "DestinyStatGroupDefinition"
        )! as DestinyStatGroupDefinition[],
        manifestTables.get("DestinyStatDefinition")! as DestinyStatDefinition[],
        manifestTables.get(
          "DestinyPlugSetDefinition"
        )! as DestinyPlugSetDefinition[],
        manifestTables.get(
          "DestinySandboxPerkDefinition"
        ) as DestinySandboxPerkDefinition[],
      ];
      const liteWeapons = [];
      const transformedWeapons = [];
      const weaponCategoryStatGroupMap = new Map<number, number>();
      function addToStatGroupMap(item: DestinyInventoryItemDefinition) {
        for (const cat of item.itemCategoryHashes!) {
          if (weaponCategoryStatGroupMap.has(cat)) continue;
          else weaponCategoryStatGroupMap.set(cat, item.stats!.statGroupHash!);
        }
      }
      for (const weapon of weapons) {
        addToStatGroupMap(weapon);
        const transformedWeapon = transformWeapon(
          weapon,
          categorisedItems,
          plugSets,
          statGroups,
          statDefs,
          sandboxPerks
        );

        const result = transformWeaponLite(
          weapon,
          categorisedItems,
          plugSets,
          statGroups,
          statDefs
        );
        liteWeapons.push(result);
        transformedWeapons.push(transformedWeapon);
      }
      return [
        manifestTables,
        categorisedItems,
        new Map()
          .set("WeaponsLite", liteWeapons)
          .set("Weapons", transformedWeapons)
          .set("WeaponCategoryStatGroupMap", weaponCategoryStatGroupMap),
      ] as const;
    });
}
