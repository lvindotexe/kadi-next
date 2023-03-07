import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { Weapon, WeaponLite } from "../../types/weaponTypes";
import { procedure, router } from "../trpc";

export const appRouter = router({
  weaponByID: procedure.input(z.string()).query(async (req) => {
    const { input } = req;
    return fs
      .readFile(path.resolve() + "/public/Weapons.json", "utf-8")
      .then((contents) => JSON.parse(contents) as Weapon[])
      .then((weapons) => weapons.find((e) => e.hash === parseInt(input)));
  }),
  weapons: procedure.query(async () => {
    return fs
      .readFile(path.resolve() + "/public/WeaponsLite.json", "utf-8")
      .then((content) => JSON.parse(content) as WeaponLite[]);
  }),
});
export type AppRouter = typeof appRouter;
