import {BlenderAddonProps} from "./Types";
import {BlenderPanel} from "./BlenderPanel";
import {BlenderPropertyGroup} from "./BlenderPropertyGroup";
import {addIndentDepth} from "./Utils";

export const BlenderAddon = ({
                               name,
                               author,
                               description,
                               blender,
                               version,
                               location,
                               warning,
                               panels,
                             }: BlenderAddonProps) =>
  `
import bpy
import os
from pathlib import Path
from bpy_extras.io_utils import ImportHelper 
from bpy.types import Operator, OperatorFileListElement
from bpy.props import CollectionProperty, StringProperty

bl_info = {
    "name": "${name}",
    "author": "${author}",
    "description": "${description}",
    "blender": (${blender.major}, ${blender.minor}, ${blender.patch}),
    "version": (${version.major}, ${version.minor}, ${version.patch}),
    "location": "${location}",
    "warning": "${warning}"
}

def item_to_dict(item):
    return {attr: getattr(item, attr) for attr in dir(item) if not callable(getattr(item, attr)) and not attr.startswith("__")}

def add_keyframe_to_channel(obj, prop_name, frame, value):
    # Store whatever your exporter / panel logic expects
    obj[prop_name] = value

    # Make sure anim data + action exist in a generic way
    if not obj.animation_data:
        obj.animation_data_create()
    if not obj.animation_data.action:
        obj.animation_data.action = bpy.data.actions.new(obj.name + "_Action")

    # Let Blender handle fcurves/channels internally (4.4 & 5.x safe)
    obj.keyframe_insert(
        data_path=f'["{prop_name}"]',
        frame=frame,
        group="FPE Frame Events",  # just for UI grouping, optional
    )

def remove_keyframe_from_channel(obj, prop_name, frame):
    obj.keyframe_delete(
        data_path=f'["{prop_name}"]',
        frame=frame,
    )

def is_bpy_prop_collection(obj):
    return hasattr(obj, "add") and hasattr(obj, "remove")

def split_path(path):
    return path.split('.')

def get_value_by_path(obj, path):
    parts = split_path(path)
    for part in parts[:-1]:
        if obj is None:
            return None  # Prevents errors when encountering None
        if is_bpy_prop_collection(obj):
            obj = obj[int(part)]
        else:
            obj = getattr(obj, part, None)  # Avoids crashing on missing attributes
    if obj is None:
        return None
    if is_bpy_prop_collection(obj):
        return obj[int(parts[-1])] if int(parts[-1]) < len(obj) else None
    else:
        return getattr(obj, parts[-1], None)

def set_value_by_path(obj, path, value):
    parts = split_path(path)
    for part in parts[:-1]:
        if is_bpy_prop_collection(obj):
            obj = obj[int(part)]
        else:
            obj = getattr(obj, part)
    if is_bpy_prop_collection(obj):
        obj[int(parts[-1])] = value
    else:
        setattr(obj, parts[-1], value)

def get_frame_number():
    try:
        action = bpy.context.object.animation_data.action
        groups = action.groups
        for g in groups:
            for c in g.channels:
                if c.select:
                    for k in c.keyframe_points:
                        if k.select_control_point:
                            return k.co[0]
    except:
        return 0

def find_file_upwards(starting_path, target_file):
    current_path = os.path.abspath(starting_path)

    while True:
        file_path = os.path.join(current_path, target_file)
        if os.path.isfile(file_path):
            relative_path = os.path.relpath(starting_path, current_path)
            return relative_path

        # Move one level up in the directory hierarchy
        current_path = os.path.dirname(current_path)

        # Check if we have reached the root directory
        if current_path == os.path.dirname(current_path):
            break

    return None

def do_redraw_all():
    for area in bpy.context.screen.areas:
        area.tag_redraw()

# --- Default-value handlers -------------------------------------------------

def _fpe_default_frame_number(context, context_base, context_object, item):
    # Just current frame
    return context.scene.frame_current

def _fpe_default_frame_time(context, context_base, context_object, item):
    scene = context.scene
    fps = scene.render.fps / scene.render.fps_base
    return scene.frame_current / fps

DEFAULT_VALUE_FUNCTIONS = {
    "FPE_FRAME_EVENT_FRAME_NUMBER": _fpe_default_frame_number,
    "FPE_FRAME_EVENT_FRAME_TIME": _fpe_default_frame_time,
}

# --- on_add / on_remove handlers --------------------------------------------

def _fpe_on_add_frame_event(context, context_base, context_object, item):
    add_keyframe_to_channel(
        context.object,
        "FPE_FRAME_EVENTS",
        frame=context.scene.frame_current,
        value=context.scene.frame_current,
    )

def _fpe_on_remove_frame_event(context, context_base, context_object, item):
    frame = item.get("FrameNumber")
    if frame is None:
        return

    frame_events = getattr(context_object, "FrameEvents", None)
    if frame_events is None:
        # No collection left, safe to remove the keyframe
        remove_keyframe_from_channel(context.object, "FPE_FRAME_EVENTS", frame=frame)
        return

    for fe in frame_events:
        if fe.FrameNumber == frame:
            # At least one event still on this frame — keep the keyframe
            return

    # No events left on this frame — now we can remove the keyframe
    remove_keyframe_from_channel(context.object, "FPE_FRAME_EVENTS", frame=frame)

ON_ADD_HANDLERS = {
    "FPE_ON_ADD_FRAME_EVENT": _fpe_on_add_frame_event,
}

ON_REMOVE_HANDLERS = {
    "FPE_ON_REMOVE_FRAME_EVENT": _fpe_on_remove_frame_event,
}

# ----------------------------------------------------------------------------

class DefaultsPropertyGroup(bpy.types.PropertyGroup):
    key: bpy.props.StringProperty()
    value: bpy.props.StringProperty()
    value_is_function: bpy.props.BoolProperty()

class AddItemOperator(Operator):
    bl_idname = "folded_paper_engine.add_item_operator"
    bl_label = "Add Item"
    bl_description = "Add an item"
    defaults: bpy.props.CollectionProperty(type=DefaultsPropertyGroup)
    context_object_path: bpy.props.StringProperty()
    prop_name: bpy.props.StringProperty()
    on_add: bpy.props.StringProperty()
    context_base: bpy.props.StringProperty()

    def execute(self, context):
        context_base = getattr(context, self.context_base) if self.context_base else context.object
        context_object = get_value_by_path(context_base, self.context_object_path)
        prop = getattr(context_object, self.prop_name)

        item = prop.add()

        if self.defaults:
            for default in self.defaults:
                key = default.key

                if default.value_is_function:
                    func = DEFAULT_VALUE_FUNCTIONS.get(default.value)
                    if func is not None:
                        value = func(context, context_base, context_object, item)
                    else:
                        # Fallback: treat as literal if handler missing
                        value = default.value
                else:
                    value = default.value

                setattr(item, key, value)

        if self.on_add:
            handler = ON_ADD_HANDLERS.get(self.on_add)
            if handler is not None:
                handler(context, context_base, context_object, item)

        do_redraw_all()

        return {'FINISHED'}

class RemoveItemOperator(Operator):
    bl_idname = "folded_paper_engine.remove_item_operator"
    bl_label = "Remove Item"
    bl_description = "Remove an item"
    context_object_path: bpy.props.StringProperty()
    prop_name: bpy.props.StringProperty()
    item_index: bpy.props.IntProperty()
    on_remove: bpy.props.StringProperty()
    context_base: bpy.props.StringProperty()

    def execute(self, context):
        context_base = getattr(context, self.context_base) if self.context_base else context.object
        context_object = get_value_by_path(context_base, self.context_object_path)
        prop = getattr(context_object, self.prop_name)

        item = item_to_dict(prop[self.item_index])
        prop.remove(self.item_index)

        if self.on_remove:
            handler = ON_REMOVE_HANDLERS.get(self.on_remove)
            if handler is not None:
                handler(context, context_base, context_object, item)

        do_redraw_all()

        return {'FINISHED'}

class FileBrowserItem(bpy.types.PropertyGroup):
    path: bpy.props.StringProperty(name="Path", subtype="FILE_PATH")

class FileBrowserOperator(Operator, ImportHelper):
    bl_idname = "folded_paper_engine.file_browser_operator"
    bl_label = "Select"
    bl_description = "Browse for a file or files"
    directory : StringProperty(subtype='DIR_PATH')
    files : CollectionProperty(type=OperatorFileListElement)
    
    # Properties
    context_object_path: bpy.props.StringProperty()
    prop_name: bpy.props.StringProperty()
    context_base: bpy.props.StringProperty()
    description: bpy.props.StringProperty()
    multiple: bpy.props.BoolProperty(default=False)

    # Only accept the designated file types/extensions
    filename_ext = ""
    filter_glob: bpy.props.StringProperty(
        default="",
        options={'HIDDEN'},
    )

    @classmethod
    def description(cls, context, properties):
        specific_description = properties.description if properties.description else cls.bl_description
        
        return specific_description
    
    def execute(self, context):
        # Get the property group
        context_base = getattr(context, self.context_base) if self.context_base else context.object
        prop_group = get_value_by_path(context_base, self.context_object_path)
        
        base = Path(self.directory)
        target_file = 'project.godot'
        result = find_file_upwards(base, target_file)
        target_base = result
        
        if result:
            target_base = f'res://{result}'
        else:
            target_base = 'res://'
        
        if self.multiple:
            # Get the collection property
            collection_prop = getattr(prop_group, self.prop_name)
            
            for fi in self.files:
                fbi = collection_prop.add()
                fbi.path = f'{target_base}/{fi.name}'
        else:
            # Get the string property
            setattr(prop_group, self.prop_name, f'{target_base}/{self.files[0].name}')
        
        # Call the redraw function
        do_redraw_all()
        
        return {'FINISHED'}

class ClearValueOperator(bpy.types.Operator):
    bl_idname = "folded_paper_engine.clear_value_operator"
    bl_label = "Clear Value"
    bl_description = "Clear the value"
    context_object_path: bpy.props.StringProperty() 
    prop_name: bpy.props.StringProperty()
    context_base: bpy.props.StringProperty()

    def execute(self, context):
        try:
            context_base = getattr(context, self.context_base) if self.context_base else context.object
            context_object = get_value_by_path(context_base, self.context_object_path)
            del context_object[self.prop_name]
        except:
            pass
        
        do_redraw_all()
        
        return {'FINISHED'}

${panels.map((p) => BlenderPropertyGroup(p)).join("")}

${panels.filter(p => !p.noPanel).map((p, idx) => BlenderPanel(p, 0, idx + 1)).join("")}

def register():
    bpy.utils.register_class(DefaultsPropertyGroup)
    bpy.utils.register_class(AddItemOperator)
    bpy.utils.register_class(RemoveItemOperator)
    bpy.utils.register_class(FileBrowserItem)
    bpy.utils.register_class(FileBrowserOperator)
    bpy.utils.register_class(ClearValueOperator)
${addIndentDepth(
    panels
      .map((p) => `bpy.utils.register_class(${p.name}PropertyGroup)`)
      .join("\n"),
    1
  )}
${addIndentDepth(
    panels
      .filter(p => !p.noPanel)
      .map((p) => `bpy.utils.register_class(${p.name})`)
      .join("\n"),
    1
  )}
    # Context Object Property Group Setup
    bpy.types.Action.FPE_FRAME_COMMANDS = bpy.props.BoolProperty()
${addIndentDepth(
    panels
      .filter(p => !p.noPanel)
      .map(
        ({name, contextObject, registerOn = "Object"}) =>
          `bpy.types.${registerOn}.${contextObject
            .split(".")
            .pop()} = bpy.props.PointerProperty(type=${name}PropertyGroup)`
      )
      .join("\n"),
    1
  )}

def unregister():
    bpy.utils.unregister_class(DefaultsPropertyGroup)
    bpy.utils.unregister_class(AddItemOperator)
    bpy.utils.unregister_class(RemoveItemOperator)
    bpy.utils.unregister_class(FileBrowserItem)
    bpy.utils.unregister_class(FileBrowserOperator)
    bpy.utils.unregister_class(ClearValueOperator)
${addIndentDepth(
    panels
      .map((p) => `bpy.utils.unregister_class(${p.name}PropertyGroup)`)
      .join("\n"),
    1
  )}
${addIndentDepth(
    panels
      .filter(p => !p.noPanel)
      .map((p) => `bpy.utils.unregister_class(${p.name})`)
      .join("\n"),
    1
  )}
    # Context Object Property Group Teardown
    del bpy.types.Action.FPE_FRAME_COMMANDS
${addIndentDepth(
    panels
      .filter(p => !p.noPanel)
      .map(
        ({contextObject, registerOn = "Object"}) =>
          `del bpy.types.${registerOn}.${contextObject.split(".").pop()}`
      )
      .join("\n"),
    1
  )}

if __name__ == "__main__":
    register()
`
    .split("\n")
    .join("\n");