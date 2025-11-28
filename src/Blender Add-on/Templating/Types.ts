import {PropTypeMap} from "./Utils";

export type BlenderAddonVersionNumber = {
  major: number;
  minor: number;
  patch: number;
};
export type BlenderPanelPropertyProps<PanelConfigType extends SpecificPanelConfig = SpecificPanelConfig> = {
  name: string;
  label: string;
  type: keyof typeof PropTypeMap;
  description: string;
  hidden?: boolean;
  disableClearValue?: boolean;
  config?: PanelConfigType;
  defaultValue?: any;
  getter?: string;
  setter?: string;
  operatorType?: string;
  subType?: string;
  subItemLabel?: string;
  subItemLabelField?: string;
  subItemDefaultValues?: {
    key: string;
    value: string;
    valueIsFunction?: boolean;
  }[];
  subItemProperties?: BlenderPanelPropertyProps[];
  onAddSubItem?: string;
  onRemoveSubItem?: string;
};
export type ExtraArgsHandler = (prop: BlenderPanelPropertyProps) => string;
export type FileBrowserConfig = {
  filter_glob?: string;
};
export type NumericInputConfig = {
  min?: string;
  max?: string;
};
export type EnumItem = {
  id: string;
  label?: string;
  description?: string;
};
export type EnumInputConfig = {
  items?: EnumItem[];
};
export type InputTemplateFunction = (
  prop: BlenderPanelPropertyProps,
  pathPrefix: string,
  nestingLevel: number,
  contextBase?: string,
  layoutObject?: string,
  layoutObjectParent?: string,
) => string;
export type BlenderPanelProps = {
  name: string;
  label: string;
  space: string;
  region: string;
  category?: string;
  panelContext?: string;
  contextObject: string;
  registerOn?: string;
  additionalCode?: string;
  noPoll?: boolean;
  contextBase?: string;
  properties: BlenderPanelPropertyProps[];
  defaultOpen?: boolean;
  noPanel?: boolean;
};
export type BlenderAddonProps = {
  name: string;
  author: string;
  description: string;
  blender: BlenderAddonVersionNumber;
  version: BlenderAddonVersionNumber;
  location: string;
  warning: string;
  panels: BlenderPanelProps[];
};

export enum INTERNAL_PROPERTY_NAMES {
  FPE_INTERNAL_EXPANDED = "FPE_INTERNAL_EXPANDED"
}

export type SpecificPanelConfig = Record<string, any>;