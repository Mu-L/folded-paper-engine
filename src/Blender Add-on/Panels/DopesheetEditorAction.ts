import {PropertyObjectNames} from "../Templating/FeatureTypes";
import {BlenderPanelProps} from "../Templating/Types";

export const DopesheetEditorAction: BlenderPanelProps = {
  label: "Folded Paper Engine (Animation)",
  name: "DOPESHEET_EDITOR_PT_FoldedPaperEngine",
  space: "DOPESHEET_EDITOR",
  region: "UI",
  category: "Action",
  contextObject: PropertyObjectNames.Animation,
  registerOn: "Action",
  properties: [
    {
      name: "Autoplay",
      label: "Autoplay",
      type: "boolean",
      description: "Set to true to play this animation automatically",
      defaultValue: "False",
    },
    {
      name: "Loop",
      label: "Loop",
      type: "boolean",
      description: "Set to true to loop this animation",
      defaultValue: "False",
    },
  ],
};
