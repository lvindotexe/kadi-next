import { loadManifest } from "../lib/manifestLoader.js";
import fs from "fs";
import path, { dirname } from "path";

(async function main() {
  await loadManifest().then((result) => {
    result.slice(1).forEach((table) => {
      for (const [k, v] of table) {
        fs.writeFileSync(
          path.resolve() + "/public/" + k + ".json",
          JSON.stringify(v)
        );
      }
    });
  });
})();
