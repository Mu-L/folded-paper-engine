export type VersionInfo = {
  major: number;
  minor: number;
  patch: number;
};

export const getVersion = (): string => {
  // CI always sets VERSION from the version branch
  return (process.env.VERSION ?? "0.0.0").trim().replace(/^v/i, "");
};

export const getVersionInfo = (): VersionInfo => {
  const [maj = "0", min = "0", pat = "0"] = getVersion().split(".");
  const n = (s: string) => parseInt((s || "0").replace(/\D/g, "") || "0", 10);
  return {major: n(maj), minor: n(min), patch: n(pat)};
};
