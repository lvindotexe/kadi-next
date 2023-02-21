import { useQuery } from "@tanstack/react-query";
import {
  DestinyStatDefinition,
  DestinyStatGroupDefinition,
} from "bungie-api-ts/destiny2";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWeaponSearch } from "../../hooks/search";
import { debounce, getManifestTables } from "../../lib/utils";
import { WeaponLitePropertyHash } from "../../types/types";
import { WeaponLite } from "../../types/weaponTypes";

type ToggleGroupProps<T extends keyof WeaponLite> = {
  title: string;
  propertyHashes: WeaponLitePropertyHash<T>;
  updateFilterFunctions: ReturnType<
    typeof useWeaponSearch
  >["updateFilterFunctions"];
};
export function ToggleGroup<
  T extends keyof Pick<
    WeaponLite,
    "ammoType" | "defaultDamageType" | "equipmentSlotTypeHash" | "itemCategory"
  >
>({ title, propertyHashes, updateFilterFunctions }: ToggleGroupProps<T>) {
  const setter = updateFilterFunctions(
    propertyHashes.propertyName,
    propertyHashes.filterImplementation
  );

  const selectedItemsRef = useRef(new Array<WeaponLite[T]>());
  return (
    <div>
      <p className="border-b-[1px] border-b-gray-400 py-2 text-2xl font-bold text-gray-400">
        {title}
      </p>
      <ul className="flex shrink grow flex-wrap gap-2 py-4">
        {Object.entries(propertyHashes.proertyHashes).map(([k, v], index) => (
          <ToggleItem
            key={k + index}
            name={k}
            hash={v}
            //@ts-ignore ts thinks these are different types but theyre not
            setter={setter}
            selectedItemsRef={selectedItemsRef}
          />
        ))}
      </ul>
    </div>
  );
}

type ToggleItemProps<
  T extends keyof Pick<
    WeaponLite,
    "ammoType" | "defaultDamageType" | "equipmentSlotTypeHash" | "itemCategory"
  >
> = {
  name: string;
  hash: number;
  selectedItemsRef: MutableRefObject<Array<WeaponLite[T]>>;
  setter: ReturnType<
    ReturnType<typeof useWeaponSearch>["updateFilterFunctions"]
  >;
};

export function ToggleItem<
  T extends keyof Pick<
    WeaponLite,
    "ammoType" | "defaultDamageType" | "equipmentSlotTypeHash" | "itemCategory"
  >
>({ name, hash, selectedItemsRef, setter }: ToggleItemProps<T>) {
  const [selected, setSelected] = useState(false);
  const debouncedSetter = useCallback(debounce(setter, 200), []);
  const handleClick = () => {
    setSelected(!selected);
    selectedItemsRef.current = !selected
      ? //@ts-ignore fixme
        selectedItemsRef.current.concat([hash])
      : selectedItemsRef.current.filter((e) => e !== hash);
    //@ts-ignore
    debouncedSetter(selectedItemsRef.current);
  };
  return (
    <button
      className={`${
        selected ? "bg-white" : "border-[1px] bg-black"
      } rounded-full px-4 py-[0.1rem] text-[1.1rem] ${
        selected ? "text-black" : "text-white"
      }`}
      onClick={handleClick}
    >
      {name}
    </button>
  );
}

type ToggleStatItemProps = {
  stat: { name: string; hash: number };
  statsToFilter: MutableRefObject<Map<number, number>>;
  setter: (props: Record<number, number>) => void;
};

export function ToggleStatItem({
  stat,
  statsToFilter,
  setter,
}: ToggleStatItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [statValue, setStatValue] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const debouncedSetter = useMemo(() => debounce(setter, 100), []);
  return (
    <div
      className={` ${
        (statsToFilter.current.has(stat.hash) &&
          statsToFilter.current.get(stat.hash)! > 0) ||
        showFilter
          ? "bg-white text-black"
          : null
      } flex grow-0 basis-[max-content] gap-1 whitespace-nowrap rounded-full border-[1px] px-4 py-[0.1rem]`}
      onClick={() => setShowFilter(!showFilter)}
    >
      <p>
        {stat.name + (statValue == 0 && !showFilter ? "" : ": " + statValue)}
      </p>
      {showFilter && (
        <input
          ref={inputRef}
          type="range"
          max={100}
          defaultValue={
            !statsToFilter.current.has(stat.hash)
              ? 0
              : statsToFilter.current.get(stat.hash)
          }
          onChange={(e) => {
            statsToFilter.current.set(stat.hash, parseInt(e.target.value));
            setStatValue(parseInt(e.target.value));
            const result = [...statsToFilter.current.entries()].filter(
              ([hash, value]) => value > 0
            );
            debouncedSetter(Object.fromEntries(result));
          }}
        />
      )}
    </div>
  );
}

type ToggleStatGroupProps = {
  updateFilterFunctions: ReturnType<
    typeof useWeaponSearch
  >["updateFilterFunctions"];
  parameters: ReturnType<typeof useWeaponSearch>["parameters"];
  setSortBy: ReturnType<typeof useWeaponSearch>["setSortBy"];
};

export function ToggleStatGroup({
  updateFilterFunctions,
  parameters,
  setSortBy,
}: ToggleStatGroupProps) {
  const statsToFilter = useRef(new Map<number, number>());
  const setter = updateFilterFunctions("stats", (statsToFilter, prop) => {
    return Object.entries(statsToFilter).every(([stat, value]) => {
      const selectedStat = prop[parseInt(stat)];
      return selectedStat ? selectedStat > value : false;
    });
  });

  const { data } = useQuery(["tables"], () =>
    getManifestTables([
      "DestinyStatGroupDefinition",
      "DestinyStatDefinition",
      "WeaponCategoryStatGroupMap",
    ])
  );

  if (!data) return null;

  const [
    destinyStatDefinitions,
    destinyStatGroupDefinition,
    weaponCategoryStatGroupMap,
  ] = [
    data.get("DestinyStatDefinition") as DestinyStatDefinition[],
    data.get("DestinyStatGroupDefinition") as DestinyStatGroupDefinition[],
    data.get("WeaponCategoryStatGroupMap") as Record<number, number>,
  ];

  const getStatsToshow = () => {
    const itemCategories = parameters.get("itemCategory");
    if (!(itemCategories instanceof Array)) throw "something is horribly wrong";

    const statGroupHashes = itemCategories.map(
      (cat) => weaponCategoryStatGroupMap[cat]
    );
    const statDisplayDefinitions = new Map(
      destinyStatGroupDefinition
        .filter((e) => statGroupHashes.includes(e.hash))
        .map((e) => [e.hash, e.scaledStats])
    );
    return new Map(
      [...statDisplayDefinitions.values()].flatMap((v) =>
        v.map((e) => [e.statHash, e.displayInterpolation] as const)
      )
    );
  };

  const statHashDisplayInterpolationMap = getStatsToshow();
  const filteredDefinitions = destinyStatDefinitions.filter(
    (e) =>
      statHashDisplayInterpolationMap.has(e.hash)! &&
      statHashDisplayInterpolationMap.get(e.hash)!.length < 3
  );

  return (
    <div>
      <p className="border-b-[1px] py-2 text-2xl font-bold text-gray-400">
        Stats
      </p>
      <ul className="flex shrink grow flex-wrap gap-2 py-4">
        <SortByOption
          parameters={parameters}
          statDefinitions={filteredDefinitions}
          setSortBy={setSortBy}
        />
        {filteredDefinitions.map((e) => (
          <ToggleStatItem
            key={e.hash}
            stat={{
              name: e.displayProperties.name,
              hash: e.hash,
            }}
            statsToFilter={statsToFilter}
            setter={setter}
          />
        ))}
      </ul>
    </div>
  );
}

type SortByProps = {
  parameters: ReturnType<typeof useWeaponSearch>["parameters"];
  statDefinitions: DestinyStatDefinition[];
  setSortBy: ReturnType<typeof useWeaponSearch>["setSortBy"];
};

type SelectProps<T> = {
  items: T[];
  className: string;
  title: string;
  render: (item: T) => React.ReactNode;
  onChange: (item: T | null) => void;
  identifier: T extends Object ? (old: T, newItem: T) => boolean : null;
};

function Select<
  T extends { hash: number; displayProperties: { name: string } }
>({ title, className, items, render, identifier, onChange }: SelectProps<T>) {
  const prevState = useRef<T | null>(null);
  const [selected, setSelected] = useState<T | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    onChange(selected);
  }, [selected]);
  return (
    <div
      className={` ${
        selected ? "bg-white text-black" : "bg-black text-white"
      } relative flex-col rounded-full border-[1px] px-4 py-[0.1rem]`}
      onClick={() => setShow(!show)}
    >
      <p>{`${
        title + (selected ? " " + selected.displayProperties.name : "")
      }`}</p>
      <ul
        className={`${className} ${
          show ? "" : "hidden"
        } absolute top-8  z-10  rounded-md border-[1px] bg-black p-2 text-white`}
      >
        {items.map((e, index) => (
          <li
            key={e.hash + index}
            onClick={() => {
              setSelected((prev) => {
                const newState = !prev ? e : prev.hash === e.hash ? null : e;
                const isSame =
                  prev instanceof Object && newState !== null
                    ? identifier(prev, newState)
                    : prev == newState;
                if (!isSame) prevState.current = prev;
                return newState;
              });
            }}
          >
            {render(e)}
          </li>
        ))}
      </ul>
    </div>
  );
}

const SortByOption: React.FC<SortByProps> = ({
  parameters,
  statDefinitions,
  setSortBy,
}) => {
  if (!parameters.has("itemCategory")) return null;
  return (
    <Select
      title="Sort By"
      className="rounded-sm border-[1px]"
      items={statDefinitions}
      identifier={(old, newValue) => old.hash === newValue.hash}
      onChange={(newValue) =>
        setSortBy((prev) => ({
          ...prev,
          hash: newValue ? newValue.hash : null,
        }))
      }
      render={(item) => (
        <>
          <div data-value={item.hash}>{item.displayProperties.name}</div>
        </>
      )}
    />
  );
};
