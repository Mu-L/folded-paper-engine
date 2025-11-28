import {BlenderPanelPropertyProps, ExtraArgsHandler, FileBrowserConfig, InputTemplateFunction} from "./Types";

export const getFileInputTemplate = (multiple: boolean = false): InputTemplateFunction => (
  {
    name,
    label,
    type,
    description,
    config: {
      filter_glob = '*.*',
    } = {}
  }: BlenderPanelPropertyProps<FileBrowserConfig>,
  pathPrefix,
  nestingLevel,
  contextBase = "",
  layoutObject = "row",
) => `
${layoutObject}.label(text='${label}:')
prop = ${layoutObject}.prop(prop_parent${nestingLevel ?? 0}, '${name}')
op = ${layoutObject}.operator('folded_paper_engine.file_browser_operator', text='Browse', emboss=False)
op.context_object_path = f'${pathPrefix}'
op.prop_name = '${name}'
op.context_base = '${contextBase}'
op.description = '${description}'
op.multiple = ${multiple ? "True" : "False"}
op.filter_glob = ${type === "image" || type === "images" ? 'bpy.types.Image' : `'${filter_glob}'`}
`;
export const numericExtraArgsHandler: ExtraArgsHandler = ({config}) => config ? [
  `min=${config.min}`,
  `max=${config.max}`,
].join(", ") : '';
export const addIndentDepth = (
  content: string = "",
  indexLevel: number = 0
): string =>
  content
    .split("\n")
    .map((line) => `${"    ".repeat(indexLevel)}${line}`)
    .join("\n");
export const PropTypeMap = {
  string: "StringProperty",
  int: "IntProperty",
  number: "FloatProperty",
  boolean: "BoolProperty",
  node: "StringProperty",
  file: "StringProperty",
  files: "CollectionProperty",
  image: "StringProperty",
  images: "StringProperty",
  collection: "CollectionProperty",
  object: "PointerProperty",
  enum: "EnumProperty",
  hidden: "StringProperty",
  operator: "Operator",
  color: "FloatVectorProperty",
};