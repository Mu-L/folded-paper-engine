import {InputTemplateMap} from "./InputTemplateMap";
import {defaultInputTemplate, PropTypeOmitFromPropertyGroup} from "./EnumExtraArgsHandler";
import {BlenderPanelPropertyProps} from "./Types";
import {addIndentDepth} from "./Utils";

export const BlenderPanelProperty = (
  prop: BlenderPanelPropertyProps,
  pathPrefix: string,
  nestingLevel: number,
  indentLevel: number = 0,
  propParent?: string,
  layoutObject: string = "layout",
  contextBase: string = "",
  propParentIsObject: boolean = false,
) => {
  const {name, type, hidden = false, disableClearValue = false} = prop;
  const currentPath = propParent && !propParentIsObject
    ? `${pathPrefix}.{idx${nestingLevel ?? 0}}`
    : pathPrefix;

  return hidden || type === "hidden"
    ? ""
    : addIndentDepth(
      `
row${nestingLevel ?? 0} = ${layoutObject}.row()
${
        !PropTypeOmitFromPropertyGroup[type] && !disableClearValue
          ? `
op = row${nestingLevel ?? 0}.operator('folded_paper_engine.clear_value_operator', text='', icon='X', emboss=False)
op.context_object_path = f'${currentPath}'
op.prop_name = '${name}'
op.context_base = '${contextBase}'
`
          : ""
      }
prop_parent${nestingLevel ?? 0} = ${
        propParent
          ? propParent
          : `get_value_by_path(context.${
            contextBase ? contextBase : "object"
          }, f'${currentPath}')`
      }
${
        InputTemplateMap[type]
          ? InputTemplateMap[type](prop, currentPath, nestingLevel ?? 0, contextBase, `row${nestingLevel ?? 0}`, layoutObject)
          : defaultInputTemplate(prop, currentPath, nestingLevel ?? 0, contextBase, `row${nestingLevel ?? 0}`, layoutObject)
      }

`,
      indentLevel
    );
};