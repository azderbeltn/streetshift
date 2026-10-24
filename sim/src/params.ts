// Model parameters from sim/params.json, plus calibrated overrides from sim/calibration.json
// (written by validation/calibrate.ts using calibration corridors only).
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export type Level = "low" | "mid" | "high";
export const LEVELS: Level[] = ["low", "mid", "high"];

const here = dirname(fileURLToPath(import.meta.url));
export const P: any = JSON.parse(readFileSync(join(here, "..", "params.json"), "utf8"));

export const CALIBRATION_FILE = join(here, "..", "calibration.json");
export type Calibration = { pedUpliftBase: number; fitOn: string[]; fittedAt: string; note?: string };

/** Fitted base pedestrian uplift on a closed street (fraction). Prior used before calibration. */
export const PRIOR_UPLIFT = 0.3;

export function calibration(): Calibration | null {
  return existsSync(CALIBRATION_FILE) ? JSON.parse(readFileSync(CALIBRATION_FILE, "utf8")) : null;
}

let override: number | null = null;
/** Used by the calibrator to evaluate candidate values without writing the file. */
export function setUpliftOverride(v: number | null) { override = v; }
export function pedUpliftBase(): number { return override ?? calibration()?.pedUpliftBase ?? PRIOR_UPLIFT; }
