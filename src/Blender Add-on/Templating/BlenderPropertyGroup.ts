import {BlenderPanelPropertyProps, BlenderPanelProps, INTERNAL_PROPERTY_NAMES} from "./Types";
import {BlenderPropertyGroupProperty} from "./BlenderPropertyGroupProperty";
import {PropTypeOmitFromPropertyGroup} from "./EnumExtraArgsHandler";
import {addIndentDepth} from "./Utils";

export const BlenderPropertyGroup = (
  {name, properties = []}: BlenderPanelProps,
  indentLevel: number = 0
) =>
  addIndentDepth(
    `
class ${name}PropertyGroup(bpy.types.PropertyGroup):
${[
      {
        name: INTERNAL_PROPERTY_NAMES.FPE_INTERNAL_EXPANDED,
        label: "Expanded",
        description: "Whether the group is expanded or not",
        type: "boolean",
        defaultValue: "False",
        hidden: true,
      } as BlenderPanelPropertyProps,
      ...properties,
    ]
      .filter((p) => !PropTypeOmitFromPropertyGroup[p.type])
      .map((p) => BlenderPropertyGroupProperty(p, indentLevel + 1))
      .join("\n")}

`,
    indentLevel
  );