import {PropertyObjectNames} from "../Templating/FeatureTypes";
import {ADDON_CATEGORY} from "../Templating/FeatureConstants";
import {
  TRIGGER_EVENT_PROPERTY_GROUP_NAME,
  TriggerEventPropertyGroup
} from "../PropertyGroups/TriggerEventPropertyGroup";
import {BlenderPanelProps} from "../Templating/Types";

export const View3DTriggerEvents: BlenderPanelProps = {
  label: "Trigger Events",
  name: "VIEW3D_TRIGGER_EVENTS_PT_FoldedPaperEngine",
  space: "VIEW_3D",
  region: "UI",
  category: ADDON_CATEGORY,
  contextObject: PropertyObjectNames.TriggerEvents,
  properties: [
    {
      name: "TriggerGroups",
      label: "Trigger Groups",
      type: "string",
      description: "The trigger groups for this item",
    },
    {
      name: "TriggerEvents",
      label: "Trigger Events",
      type: "collection",
      subType: TRIGGER_EVENT_PROPERTY_GROUP_NAME,
      subItemProperties: TriggerEventPropertyGroup.properties,
      subItemLabelField: "EventName",
      description: "The Scene Events that will be triggered when this item is a trigger",
    },
  ],
};
