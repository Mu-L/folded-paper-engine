import {PropertyObjectNames} from "../Templating/FeatureTypes";
import {ADDON_CATEGORY} from "../Templating/FeatureConstants";
import {BlenderPanelProps} from "../Templating/Types";

export const View3DInventoryItem: BlenderPanelProps = {
  label: "Inventory Item",
  name: "VIEW3D_INVENTORY_PT_FoldedPaperEngine",
  space: "VIEW_3D",
  region: "UI",
  category: ADDON_CATEGORY,
  contextObject: PropertyObjectNames.Inventory,
  properties: [
    {
      name: "InventoryItemKind",
      label: "Inventory Item Kind",
      type: "string",
      description: "The Inventory Item Kind",
    },
    {
      name: "InventoryItemQuantity",
      label: "Inventory Item Quantity",
      type: "int",
      description: "The Inventory Item Quantity",
    }
  ],
};
