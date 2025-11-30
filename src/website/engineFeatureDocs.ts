import { marked } from "marked";
import { FoldedPaperEngineAddon } from "../Blender Add-on/Templating/FoldedPaperEngineAddon";
import {
  BlenderPanelPropertyProps,
  BlenderPanelProps,
} from "../Blender Add-on/Templating/Types";
import { PropTypeMap } from "../Blender Add-on/Templating/Utils";

/**
 * Example values for each property type, shown in the legend.
 */
const EngineFeatureLegendMap: Omit<
  Record<keyof typeof PropTypeMap, string>,
  "hidden" | "operator"
> & {
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
  images:
    "`res://.../texture.png`,`res://.../texture.png`,`res://.../texture.png`",
  collection: "Multiple items",
  object: "An item with a set of settings and values",
  enum: "`One`, `Two` or `Three`",
  color: "`#FFFFFFFF`",
  csv: "`One,Two,Three`",
};

type EngineFeatureLegendMapKeys = keyof typeof EngineFeatureLegendMap;

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

/**
 * Map `SomeGroupPropertyGroup` → "Some Group"
 * Used so collection/object subtypes can link to their own sections.
 */
const PropertyGroupLabelMap: Record<string, string> =
  FoldedPaperEngineAddon.panels.reduce(
    (acc, { label, noPanel, name }) => {
      if (noPanel) {
        acc[`${name}PropertyGroup`] = label;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

/**
 * Render a single property’s Markdown bullet.
 */
const mdProp = ({
                  label,
                  type,
                  subType,
                  description,
                }: BlenderPanelPropertyProps): string => {
  const typeKey = type as EngineFeatureLegendMapKeys;
  const typeLabel = EngineFeatureLegendLabelMap[typeKey] ?? "Unknown";

  let subTypeText = "";

  if ((type === "collection" || type === "object") && subType) {
    const pgLabel =
      PropertyGroupLabelMap[subType as string] ?? "Unknown Property Group";
    subTypeText = ` of [${pgLabel}](<#${pgLabel}>)`;
  }

  return `- ${label}: (${typeLabel}${subTypeText}) ${description}.`;
};

/**
 * Render a panel (or property group) section as Markdown.
 */
const mdSection = ({ label, properties }: BlenderPanelProps): string => {
  const lines = properties
    .filter(({ hidden }) => !hidden)
    .map(mdProp)
    .join("\n");

  return `### ${label}

${lines}`;
};

/**
 * Build the full docs HTML + legend HTML for use in blender-panel-docs.astro
 */
export async function getBlenderPanelDocsHTML(): Promise<{
  docsHtml: string;
  legendHtml: string;
}> {
  // Sort so real panels come before "noPanel" property-group sections
  const panels = [...FoldedPaperEngineAddon.panels].sort((a, b) => {
    if (a.noPanel && !b.noPanel) {
      return 1;
    } else if (!a.noPanel && b.noPanel) {
      return -1;
    } else {
      return 0;
    }
  });

  const docsHtml = panels
    .map((panel) => {
      const { label, noPanel } = panel;
      const cls = noPanel ? "property-group" : "panel";
      const sectionMarkdown = mdSection(panel);
      const sectionHtml = marked.parse(sectionMarkdown);
      return `<div id="${label}" class="${cls}">${sectionHtml}</div>`;
    })
    .join("\n\n");

  const legendMarkdown = (
    Object.keys(EngineFeatureLegendMap) as EngineFeatureLegendMapKeys[]
  )
    .map(
      (key) =>
        `- ${EngineFeatureLegendLabelMap[key]}: ${EngineFeatureLegendMap[key]}`,
    )
    .join("\n");

  const legendHtml = marked.parse(legendMarkdown, {async: false});

  return { docsHtml, legendHtml };
}
