import {execSync} from "child_process";
import {cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync} from "fs";
import {tmpdir} from "os";
import {join, resolve} from "path";
import {getVersion} from "./utils/get-version";

const VERSION = getVersion();

const repoRoot = resolve(__dirname, ".."); // scripts/ -> repo root
const addonSrc = resolve(repoRoot, "src/Game/addons");
const distDir = resolve(repoRoot, "dist");
const zipPath = resolve(distDir, 'folded_paper_engine_godot.zip');

mkdirSync(distDir, {recursive: true});

const tmp = mkdtempSync(join(tmpdir(), "fpe-"));
const tmpAddon = join(tmp, "addons");

// copy
cpSync(addonSrc, tmpAddon, {recursive: true});

// patch plugin.cfg in tmp
const cfgPath = join(tmpAddon, 'folded_paper_engine', "plugin.cfg");
const cfg = readFileSync(cfgPath, "utf8").replace(/version=".*"/, `version="${VERSION}"`);
writeFileSync(cfgPath, cfg);

// zip from tmp to ABSOLUTE zipPath
execSync(`cd "${tmp}" && zip -r "${zipPath}" addons`, {
  stdio: "inherit",
  shell: "/bin/bash",
});
