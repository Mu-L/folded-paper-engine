import {numericExtraArgsHandler, PropTypeMap} from "./Utils";
import {EnumInputConfig, ExtraArgsHandler, InputTemplateFunction} from "./Types";

export const enumExtraArgsHandler: ExtraArgsHandler = ({config}) => {
  const itemStrings: string[] = [];

  if (config) {
    const {
      items = [],
    }: EnumInputConfig = config as unknown as EnumInputConfig;

    for (const itm of items) {
      const {
        id,
        label,
        description,
      } = itm;

      itemStrings.push(`("${id}", "${label ?? id}", "${description ?? label ?? id}")`)
    }
  }

  return `items=[
    ${itemStrings.join(",\n    ")}
]`;
};
export const PropTypeExtraArgsMap: Partial<
  Record<keyof typeof PropTypeMap, string | ExtraArgsHandler>
> = {
  files: "type=FileBrowserItem",
  images: "type=FileBrowserItem",
  int: numericExtraArgsHandler,
  number: numericExtraArgsHandler,
  enum: enumExtraArgsHandler,
  color: "subtype='COLOR', size=4, default=(1.0, 1.0, 1.0, 1.0), min=0.0, max=1.0",
};
export const PropTypeOmitFromPropertyGroup: Partial<
  Record<keyof typeof PropTypeMap, boolean>
> = {
  operator: true,
};
export const defaultInputTemplate: InputTemplateFunction = (
  {name, type},
  _pathPrefix,
  nestingLevel,
  _contextBase = "",
  layoutObject = "row",
) => `${layoutObject}.prop(prop_parent${nestingLevel ?? 0}, '${name}')`;