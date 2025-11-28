import {PropTypeExtraArgsMap} from "./EnumExtraArgsHandler";
import {BlenderPanelPropertyProps} from "./Types";
import {addIndentDepth, PropTypeMap} from "./Utils";

export const BlenderPropertyGroupProperty = (
  prop: BlenderPanelPropertyProps,
  indentLevel = 0
) => {
  const {
    name,
    label,
    type,
    description,
    defaultValue,
    getter,
    setter,
    subType,
  } = prop;
  const hasDefaultValue = typeof defaultValue !== "undefined";
  const extraArgs = typeof PropTypeExtraArgsMap[type] === "string" ? PropTypeExtraArgsMap[type] : (
    PropTypeExtraArgsMap[type] instanceof Function ?
      PropTypeExtraArgsMap[type](prop) :
      undefined
  );
  const args = [
    `name="${label}"`,
    `description="${description}"`,
    hasDefaultValue ? `default=${defaultValue}` : "",
    extraArgs ? extraArgs : "",
    getter ? `get=${getter}` : "",
    setter ? `set=${setter}` : "",
    subType ? `type=${subType}` : "",
  ]
    .filter((a) => a.length > 0)
    .map((v) => addIndentDepth(v, 1))
    .join(",\n");

  return addIndentDepth(
    `
${name}: bpy.props.${
      PropTypeMap[type as keyof typeof PropTypeMap] || PropTypeMap.string
    }(
${args}
)`,
    indentLevel
  );
};