import {PropertyObjectNames} from "../Templating/FeatureTypes";
import {FRAME_EVENT_PROPERTY_GROUP_NAME, FrameEventPropertyGroup} from "../PropertyGroups/FrameEventPropertyGroup";
import {BlenderPanelProps} from "../Templating/Types";

export const DopesheetEditorFrameEvents: BlenderPanelProps = {
  label: "Folded Paper Engine (Frame Events)",
  name: "DOPESHEET_EDITOR_FRAME_EVT_PT_FoldedPaperEngine",
  space: "DOPESHEET_EDITOR",
  region: "UI",
  category: "Action",
  contextObject: PropertyObjectNames.FrameEvents,
  registerOn: "Action",
  properties: [
    {
      name: "FrameEvents",
      label: "Frame Events",
      type: "collection",
      description: "Frames that trigger events",
      subType: FRAME_EVENT_PROPERTY_GROUP_NAME,
      subItemLabelField: "FrameNumber",
      subItemDefaultValues: [
        {
          key: "FrameNumber",
          value: "'FPE_FRAME_EVENT_FRAME_NUMBER'",
          valueIsFunction: true,
        },
        {
          key: "FrameTime",
          value: "'FPE_FRAME_EVENT_FRAME_TIME'",
          valueIsFunction: true,
        },
      ],
      subItemProperties: FrameEventPropertyGroup.properties,
      onAddSubItem: "'FPE_ON_ADD_FRAME_EVENT'",
      onRemoveSubItem: "'FPE_ON_REMOVE_FRAME_EVENT'",
    },
  ],
};
