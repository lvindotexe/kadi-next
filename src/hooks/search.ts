import {
  useState,
  useRef,
  useCallback,
  useMemo,
  MutableRefObject,
  Dispatch,
  SetStateAction,
} from "react";
import { WeaponLite } from "../types/weaponTypes.js";

export type FlattenArray<T> = T extends (infer U)[] ? U : T;
export type ArrayOfPrimitivesOrObject<T> = T extends Record<any, unknown>
  ? T
  : Array<T>;
export type FilterFunction = (w: WeaponLite) => boolean;
export type FilterImplementation<T extends keyof WeaponLite> = (
  types: ArrayOfPrimitivesOrObject<FlattenArray<WeaponLite[T]>>,
  property: WeaponLite[T]
) => boolean;

function useInput(inputElement: MutableRefObject<HTMLInputElement | null>) {
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

type FilterableWeaponProps = Pick<
  WeaponLite,
  | "ammoType"
  | "defaultDamageType"
  | "equipmentSlotTypeHash"
  | "investmentStats"
  | "perks"
>;

type useWeaponSearchReturn = {
  input: string;
  setInput: (input: string) => void;
  sortOrder: {
    hash: number;
    order: "asc" | "dsc";
  };
  setSortOrder: Dispatch<
    SetStateAction<{
      hash: number | null;
      order: "asc" | "dsc";
    }>
  >;
  subscribe: unknown;
};

export function useWeaponSearchNeo(
  weapons: WeaponLite[] | undefined,
  inputElement: MutableRefObject<HTMLInputElement | null>,
  initial?: "empty"
): useWeaponSearchReturn {
  const [input, setInput] = useInput(inputElement);
  const [sortOrder, setSortOrder] = useState<{
    hash: number | null;
    order: "asc" | "dsc";
  }>({
    hash: null,
    order: "asc",
  });
}

export function useWeaponSearch(
  weapons: WeaponLite[] | undefined,
  inputElement: MutableRefObject<HTMLInputElement | null>,
  initial?: "empty"
) {
  const [input, setInput] = useInput(inputElement);
  const filterFunctinsRef = useRef(new Map<keyof WeaponLite, FilterFunction>());
  const [sortBy, setSortBy] = useState<{
    hash: number | null;
    order: "asc" | "dsc";
  }>({ hash: null, order: "dsc" });
  const [parameters, setParameters] = useState(
    new Map<keyof WeaponLite, WeaponLite[keyof WeaponLite]>()
  );

  const addMethod = useCallback(
    <T extends keyof WeaponLite>(
      filterType: T,
      filterImplementation: FilterImplementation<T>
    ) => {
      return (
        props: ArrayOfPrimitivesOrObject<FlattenArray<WeaponLite[T]>>
      ) => {
        const filterFn = (weapon: WeaponLite) => {
          return filterImplementation(props, weapon[filterType]);
        };
        if (props instanceof Array) {
          if (props.length < 1) filterFunctinsRef.current.delete(filterType);
          else filterFunctinsRef.current.set(filterType, filterFn);
          setParameters((params) =>
            props.length > 0
              ? //@ts-ignore props is string[] | number[] but it can never be a string array
                new Map([...params]).set(filterType, props)
              : new Map(
                  [...params.entries()].filter(([k, _v]) => k !== filterType)
                )
          );
        } else {
          if (Object.keys(props).length < 1)
            filterFunctinsRef.current.delete(filterType);
          else filterFunctinsRef.current.set(filterType, filterFn);
          setParameters((params) =>
            new Map([...params]).set(filterType, props)
          );
        }
      };
    },
    []
  );

  const sortByFuntion = useMemo(() => {
    return sortBy && sortBy.hash
      ? (a: WeaponLite, b: WeaponLite) =>
          sortBy.order === "asc"
            ? a.stats[sortBy.hash!]! - b.stats[sortBy.hash!]!
            : b.stats[sortBy.hash!]! - a.stats[sortBy.hash!]!
      : null;
  }, [sortBy]);

  const filteredWeapons = useMemo(() => {
    if (!weapons) return null;
    const hasEntries = [...filterFunctinsRef.current.entries()].some(
      ([_k, fns]) => fns.length > 0
    );
    if (!hasEntries && typeof initial === "string" && input.length <= 3)
      return [];
    const filterImplementations = [
      ...filterFunctinsRef.current.entries(),
    ].flatMap(([_k, fns]) => fns);
    const filteredWeapons =
      filterImplementations.length > 0
        ? weapons.filter(
            (w) =>
              w.name.toLowerCase().includes(input) &&
              filterImplementations.every((fn) => fn(w))
          )
        : weapons.filter((w) => w.name.toLowerCase().includes(input));
    return sortByFuntion
      ? filteredWeapons.sort(sortByFuntion)
      : filteredWeapons;
  }, [parameters, weapons, sortByFuntion, input]);
  return {
    input,
    setInput,
    updateFilterFunctions: addMethod,
    filteredWeapons,
    parameters,
    setSortBy,
  };
}
