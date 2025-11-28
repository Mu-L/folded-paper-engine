import {BlenderPanelProperty} from "./BlenderPanelProperty";
import {InputTemplateFunction, INTERNAL_PROPERTY_NAMES} from "./Types";
import {getFileInputTemplate, PropTypeMap} from "./Utils";

export const InputTemplateMap: Partial<Record<
  keyof typeof PropTypeMap,
  InputTemplateFunction
>> = {
  node: (
    {name},
    _pathPrefix,
    nestingLevel,
    _contextBase = "",
    layoutObject = "row",
  ) =>
    `${layoutObject}.prop_search(prop_parent${nestingLevel ?? 0}, '${name}', scene, 'objects')`,
  file: getFileInputTemplate(),
  files: getFileInputTemplate(true),
  image: getFileInputTemplate(),
  images: getFileInputTemplate(true),
  collection: (
    {
      name,
      label,
      subItemDefaultValues,
      subItemProperties,
      subItemLabel,
      subItemLabelField,
      onAddSubItem,
      onRemoveSubItem,
    },
    pathPrefix,
    nestingLevel,
    contextBase = "",
    layoutObject = "row",
    layoutObjectParent = "layout",
  ) => `
${layoutObject}.label(text='${label}:')
${layoutObject}.prop(prop_parent${nestingLevel ?? 0}, '${name}')
op = ${layoutObject}.operator('folded_paper_engine.add_item_operator', text='', icon='ADD', emboss=False)
op.context_object_path = f'${pathPrefix}'
op.prop_name = '${name}'
${onAddSubItem ? `op.on_add = ${onAddSubItem}` : ""}
op.context_base = '${contextBase}'
${
    `
${
      subItemDefaultValues ?
        subItemDefaultValues
          .map(
            ({key, value, valueIsFunction}) => `
new_default = op.defaults.add()
new_default.key = '${key}'
new_default.value = ${value}
new_default.value_is_function = ${valueIsFunction ? "True" : "False"}
`
          )
          .join("\n") :
        ""
    }   

${
      subItemProperties
        ? `
prop_value = get_value_by_path(prop_parent${nestingLevel ?? 0}, '${name}')
for idx${nestingLevel ?? 0}, sub_item${nestingLevel ?? 0} in enumerate(prop_value):
    box${nestingLevel ?? 0} = ${layoutObjectParent}.box()
    ${layoutObjectParent}.separator(type='SPACE', factor=1.0)
    box_row${nestingLevel ?? 0} = box${nestingLevel ?? 0}.row()
    ${
          subItemLabelField
            ? `box_row${nestingLevel ?? 0}.label(text=str(get_value_by_path(sub_item${nestingLevel ?? 0}, '${subItemLabelField}')))`
            : subItemLabel ? `box_row${nestingLevel ?? 0}.label(text='${subItemLabel}')` : ""
        }
    op = box_row${nestingLevel ?? 0}.operator('folded_paper_engine.remove_item_operator', text='', icon='X', emboss=False)
    op.context_object_path = f'${pathPrefix}'
    op.prop_name = '${name}'
    op.item_index = idx${nestingLevel ?? 0}
    ${onRemoveSubItem ? `op.on_remove = ${onRemoveSubItem}` : ""}
    op.context_base = '${contextBase}'
    
    ${subItemProperties
          .map(
            (sI) => `
    ${BlenderPanelProperty(
              sI,
              `${pathPrefix}.${name}`,
              nestingLevel ?? 0,
              1,
              `sub_item${nestingLevel ?? 0}`,
              `box${nestingLevel ?? 0}`,
              contextBase
            )}
`
          )
          .join("\n")}
`
        : ""
    }
 
    `
  }
`,
  object: (
    {
      name,
      label,
      subItemProperties,
    },
    pathPrefix,
    nestingLevel,
    contextBase = "",
    layoutObject = "row",
  ) => `
prop_value${nestingLevel ?? 0} = get_value_by_path(prop_parent${nestingLevel ?? 0}, '${name}')
${layoutObject}.prop(prop_value${nestingLevel ?? 0}, '${INTERNAL_PROPERTY_NAMES.FPE_INTERNAL_EXPANDED}', text="", icon='TRIA_RIGHT' if not prop_value${nestingLevel ?? 0}.${INTERNAL_PROPERTY_NAMES.FPE_INTERNAL_EXPANDED} else 'TRIA_DOWN', emboss=False)
${
    subItemProperties
      ? `
col${nestingLevel ?? 0} = ${layoutObject}.column(align=True)
col${nestingLevel ?? 0}.label(text='${name}:')
if prop_value${nestingLevel ?? 0}.${INTERNAL_PROPERTY_NAMES.FPE_INTERNAL_EXPANDED}:
${subItemProperties
        .map(
          (sI) => `
${BlenderPanelProperty(
            sI,
            `${pathPrefix}.${name}`,
            (nestingLevel ?? 0) + 1,
            1,
            `prop_value${nestingLevel ?? 0}`,
            `col${nestingLevel ?? 0}`,
            contextBase,
            true,
          )}
`
        )
        .join("\n")}
`
      : ""
  }
`,
  hidden: () => "",
  operator: (
    {name, label, operatorType},
    pathPrefix,
    _nestingLevel,
    contextBase = "",
    layoutObject = "row",
  ) => `
op = ${layoutObject}.operator('${operatorType}', text='${label}')
op.context_object_path = f'${pathPrefix}'
op.prop_name = '${name}'
op.context_base = '${contextBase}'
    `,
  color: (
    {name},
    _pathPrefix,
    nestingLevel,
    _contextBase = "",
    layoutObject = "row",
  ) => `${layoutObject}.prop(prop_parent${nestingLevel ?? 0}, '${name}')`,
};