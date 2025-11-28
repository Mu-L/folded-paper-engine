import {BlenderPanelProps} from "./Types";
import {BlenderPanelProperty} from "./BlenderPanelProperty";
import {addIndentDepth} from "./Utils";

export const BlenderPanel = (
  {
    name,
    label,
    space,
    region,
    category = "",
    panelContext = "",
    contextObject,
    additionalCode = "",
    noPoll = false,
    contextBase = "",
    properties = [],
    defaultOpen = false,
  }: BlenderPanelProps,
  indentLevel: number = 0,
  order: number = 1,
) =>
  addIndentDepth(
    `
class ${name}(bpy.types.Panel):
    bl_label = '${label}'
    bl_idname = '${name}'
    bl_space_type = '${space}'
    bl_region_type = '${region}'
    ${category ? `bl_category = '${category}'` : ""}
    ${panelContext ? `bl_context = '${panelContext}'` : ""}
    bl_order = ${order}
    bl_options = {'${defaultOpen ? "HEADER_LAYOUT_EXPAND" : "DEFAULT_CLOSED"}'}

    ${
      !noPoll
        ? `
    @classmethod
    def poll(cls, context):
        context_object = get_value_by_path(context.${
          contextBase ? contextBase : "object"
        }, '${contextObject}')
        return context_object is not None
    `
        : ""
    }
        
${addIndentDepth(additionalCode, 1)}

    def draw(self, context):
        layout = self.layout
        context_object = get_value_by_path(context.${
      contextBase ? contextBase : "object"
    }, '${contextObject}')
        scene = context.scene
        
${properties
      .map((p) =>
        BlenderPanelProperty(
          p,
          contextObject,
          0,
          indentLevel + 2,
          undefined,
          undefined,
          contextBase
        )
      )
      .join("\n")}

`,
    indentLevel
  );