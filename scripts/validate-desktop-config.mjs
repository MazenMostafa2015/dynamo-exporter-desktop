// Validate the desktop shell without launching an OS-specific binary.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const requiredFiles = ["electron/main.cjs", "electron/preload.cjs", "client/src/lib/dyn-exporter.ts", "postbuild-offline.mjs"];
const missing = requiredFiles.filter((file) => !existsSync(file));
const checks = {
  mainProcess: packageJson.main === "electron/main.cjs",
  desktopDev: typeof packageJson.scripts?.["desktop:dev"] === "string",
  desktopPackage: typeof packageJson.scripts?.["desktop:package"] === "string",
  windowsTargets: packageJson.build?.win?.target?.length >= 1,
  offlineFiles: missing.length === 0,
};
if (Object.values(checks).some((value) => !value)) {
  console.error(JSON.stringify({ checks, missing }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ checks, targets: packageJson.build.win.target, status: "desktop-config-valid" }, null, 2));
