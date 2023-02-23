import { DestinyItemInvestmentStatDefinition } from "bungie-api-ts/destiny2";
import produce from "immer";
import { it } from "node:test";
import { useMemo } from "react";
import { create, StateCreator } from "zustand";
import {
  Catalyst,
  MasterWork,
  Mod,
  Ornament,
  Trait,
  Weapon,
} from "../types/weaponTypes";
export type HasInvestmentStats = Pick<Trait, "investmentStats" | "hash"> & {
  kind: string;
  column?: number;
};
type SocketItems = MasterWork | Ornament | Catalyst | Mod | Trait;
type SocketItemsKind<T extends SocketItems> = T extends SocketItems
  ? T extends Trait
    ? `${T["kind"]}1` | `${T["kind"]}2`
    : T["kind"]
  : never;

type WeaponSocketStore = {
  previewMod: null | HasInvestmentStats;
  selectPreviewMod: (item: HasInvestmentStats | null) => void;
  selectedSockets: Map<SocketItemsKind<SocketItems>, SocketItems>;
  selectSocket: (kind: SocketItemsKind<SocketItems>, item: SocketItems) => void;
  reset: () => void;
};

const createSocketStore: StateCreator<WeaponSocketStore> = (set) => ({
  previewMod: null,
  selectPreviewMod: (item) =>
    set(
      produce<WeaponSocketStore>((state) => {
        state.previewMod = item;
      })
    ),
  selectedSockets: new Map(),
  reset: () =>
    set(
      produce<WeaponSocketStore>((state) => {
        state.previewMod = null;
        state.selectedSockets = new Map();
      })
    ),
  selectSocket: (kind, item) =>
    set(
      produce<WeaponSocketStore>(({ selectedSockets: selected }) => {
        selected = selected.set(kind, item);
      })
    ),
});

const useWeaponStore = create<WeaponSocketStore>()((...a) => ({
  ...createSocketStore(...a),
}));

function hasInvestmentStats<T extends Object>(
  item: T
): item is Weapon["investmentStats"] & T {
  return "investmentStats" in item;
}

function useWeaponSockets(weapon: Weapon) {
  const { previewMod, selectedSockets, reset, selectPreviewMod, selectSocket } =
    useWeaponStore();

  const reducer = useMemo(
    () =>
      (
        acc: Map<
          number,
          Exclude<SocketItems, Ornament>["investmentStats"][number]
        >,
        current: Exclude<SocketItems, Ornament>["investmentStats"][number]
      ) => {
        if (acc.has(current.statTypeHash)) {
          const old = acc.get(current.statTypeHash)!;
          return acc.set(current.statTypeHash, {
            ...old,
            value: old.value + current.value,
          });
        }
        return acc.set(current.statTypeHash, current);
      },
    []
  );

  const stats = useMemo(() => {
    const itemsWithInvestmentStats = [...selectedSockets.entries()].filter(
      ([_, item]) => hasInvestmentStats(item)
    ) as [
      SocketItemsKind<Exclude<SocketItems, Ornament>>,
      Exclude<SocketItems, Ornament>
    ][];
    return itemsWithInvestmentStats
      .flatMap(([_, item]) => item.investmentStats)
      .reduce(reducer, new Map<number, Weapon["investmentStats"][number]>());

    return;
  }, [selectedSockets]);

  const previewStats = useMemo(
    () =>
      previewMod?.investmentStats.reduce(
        reducer,
        new Map<number, Weapon["investmentStats"][number]>()
      ),
    [previewMod]
  );
  return {
    selectedSockets,
    reset,
    previewMod,
    selectPreviewMod,
    selectSocket,
    stats,
    previewStats,
  };
}
