import {
  AllDestinyManifestComponents,
  DestinyManifest,
} from "bungie-api-ts/destiny2";
import { HttpClientConfig } from "bungie-api-ts/http";
import { set } from "idb-keyval";
import { DatabaseTables } from "../types/types.js";

export function isNotNullOrUndefined<T extends object>(
  input: null | undefined | T
): input is T {
  return input != null;
}
export function isAdept(name: string) {
  return ["harrowed", "adept", "timelost"].some((e) =>
    name.toLowerCase().includes(e)
  );
}
export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  delay: number
): (...args: Parameters<F>) => void {
  let timer: NodeJS.Timer;
  return (...args: Parameters<F>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

export function generateHttpClient(fetchLike: typeof fetch, apiKey: string) {
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

function getManifestTable<T extends keyof AllDestinyManifestComponents>(
  tableName: T
) {
  const manifest: DestinyManifest = JSON.parse(
    localStorage.getItem("manifest")!
  );

  const tableUrl = manifest.jsonWorldComponentContentPaths.en![tableName]!;

  return fetch(`https://www.bungie.net${tableUrl}`)
    .then((result) => result.json())
    .then(
      (result) =>
        Object.values(result) as Array<AllDestinyManifestComponents[T][number]>
    );
}

export function getManifestTables<T extends keyof DatabaseTables>(tables: T[]) {
  return tables
    .map(async (tableName) =>
      tableName.includes("Destiny")
        ? ([
            tableName,
            await getManifestTable(
              tableName as keyof AllDestinyManifestComponents
            ),
          ] as const)
        : fetch(`/api/${tableName}`)
            .then((response) => response.json())
            .then((response) => {
              return [
                tableName,
                Object.values(response) as DatabaseTables[T],
              ] as const;
            })
    )
    .reduce(async (acc, curr) => {
      const [awaitedAcc, [tableName, data]] = await Promise.all([acc, curr]);
      //@ts-ignore fixme
      awaitedAcc.set(tableName, data);
      return awaitedAcc;
    }, Promise.resolve(new Map<T, DatabaseTables[T]>()));
}

export function fetchAndCache<T>(urlString: string, cacheKey: string) {
  return notFetch<T>(urlString).then((result) => {
    set(cacheKey, result);
    return result;
  });
}

export function notFetch<T>(urlString: string) {
  return fetch(urlString).then((r) => r.json() as T);
}
