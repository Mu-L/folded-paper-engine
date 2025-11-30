import Path from "path";
import FS from "fs";
import {FoldedPaperEngineAddon} from "../src/Blender Add-on/Templating/FoldedPaperEngineAddon";
import {marked} from 'marked';
import {BlenderPanelPropertyProps, BlenderPanelProps} from "../src/Blender Add-on/Templating/Types";
import {PropTypeMap} from "../src/Blender Add-on/Templating/Utils";

const EngineFeatureLegendMap: Omit<Record<keyof typeof PropTypeMap, string>, "hidden" | "operator"> & {
  csv: string;
} = {
  string: "`Hi there!`",
  int: "`1`, `2`, `3`, ...",
  number: "`1.0`, `2.0`, `3.0`, ...",
  boolean: "`true` or `false`",
  node: "`MyCube`",
  file: "`res://...`",
  files: "`res://...`,`res://...`,`res://...`",
  image: "`res://.../texture.png`",
  images: "`res://.../texture.png`,`res://.../texture.png`,`res://.../texture.png`",
  collection: "Multiple items",
  object: "An item with a set of settings and values",
  enum: "`One`, `Two` or `Three`",
  color: "`#FFFFFFFF`",
  csv: "`One,Two,Three`",
};
type EngineFeatureLegendMapKeys = keyof typeof EngineFeatureLegendMap
const EngineFeatureLegendLabelMap: Record<EngineFeatureLegendMapKeys, string> = {
  string: "String",
  int: "Integer",
  number: "Float",
  boolean: "Boolean",
  node: "Node",
  file: "File",
  files: "Files",
  image: "Image",
  images: "Images",
  collection: "Collection",
  object: "Object",
  enum: "Enum",
  color: "Color",
  csv: "CSV",
};
const PropertyGroupLabelMap: Record<string, string> = FoldedPaperEngineAddon.panels
  .reduce((acc, {label, noPanel, name}) => {
    return {
      ...acc,
      ...(noPanel ? {
        [`${name}PropertyGroup`]: label,
      } : {})
    } as Record<string, string>;
  }, {});
const MDProp = ({label, type, subType, description}: BlenderPanelPropertyProps) => {
  const subTypeText = type === "collection" || type === "object" ? ` of [${PropertyGroupLabelMap[subType as string] ?? "Unknown"}](<#${PropertyGroupLabelMap[subType as string] ?? "Unknown"}>)` : ""

  return `- ${label}: (${EngineFeatureLegendLabelMap[type as EngineFeatureLegendMapKeys]}${subTypeText}) ${description}.`
};
const MDSection = ({
                     label,
                     properties
                   }: BlenderPanelProps) => `### ${label}

${properties.filter(({hidden}) => !hidden).map(MDProp).join("\n")}`;
const IndexFilePath = Path.resolve(__dirname, "..", "dist", "index.html");
const BlenderPanelDocsFilePath = Path.resolve(__dirname, "..", "dist", "blender-panel-docs.html");
const EngineFeatureDocsInsertionPoint = "${ENGINE_FEATURE_DOCS}";
const EngineFeatureLegendInsertionPoint = "${ENGINE_FEATURE_LEGEND}";
const EngineFeatureDocs = FoldedPaperEngineAddon.panels
  .sort((a, b) => {
    if (a.noPanel && !b.noPanel) {
      return 1;
    } else if (!a.noPanel && b.noPanel) {
      return -1;
    } else {
      return 0;
    }
  })
  .map((p) => {
    const {label, noPanel} = p;

    return `<div id="${label}" class="${noPanel ? "property-group" : "panel"}">${marked(
      MDSection(p),
      {
        async: false,
      }
    )}</div>`;
  })
  .join("\n\n");
const EngineFeatureLegend: string = Object.keys(EngineFeatureLegendMap).map(
  (k) => `- ${EngineFeatureLegendLabelMap[k as EngineFeatureLegendMapKeys]}: ${EngineFeatureLegendMap[k as EngineFeatureLegendMapKeys]}`
).join("\n");
const exportHTML = async () => {
  const IndexTemplate = FS.readFileSync(IndexFilePath, "utf8");
  const EngineTemplate = FS.readFileSync(BlenderPanelDocsFilePath, "utf8");
  const LegendHTML = await marked(EngineFeatureLegend);
  const FullIndexHTML = IndexTemplate
  const FullEngineDocHTML = EngineTemplate
    .replace(
      EngineFeatureDocsInsertionPoint,
      EngineFeatureDocs,
    )
    .replace(
      EngineFeatureLegendInsertionPoint,
      LegendHTML,
    )

  FS.writeFileSync(IndexFilePath, FullIndexHTML, "utf8");
  FS.writeFileSync(BlenderPanelDocsFilePath, FullEngineDocHTML, "utf8");
};

exportHTML()
  .then(
    () => console.log("Exported engine docs to", BlenderPanelDocsFilePath),
    (error) => console.error("Error exporting engine docs", error)
  );
