import { z } from "zod";
import { WeaponLite } from "../../types/weaponTypes";
import { procedure, router } from "../trpc";
import { promises as fs } from "fs";
import path from "path";

export const appRouter = router({
  weaponByID: procedure.input(z.string()).query(async (req) => {
    const { input } = req;
    return fs
      .readFile(path.resolve() + "/public/WeaponsLite.json", "utf-8")
      .then((contents) => JSON.parse(contents) as WeaponLite[])
      .then((weapons) => weapons.find((e) => e.hash === parseInt(input)));
  }),
});
export type AppRouter = typeof appRouter;
