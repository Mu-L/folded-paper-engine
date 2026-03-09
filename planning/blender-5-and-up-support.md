# Blender 5.0 Custom Property Export Regressions and Fixes for Add-ons

**OBJECTIVE:**

1. Update the TypeScript files that generate the Blender Add-on Python files. (Python is used as templates, while
   TypeScript defines the add-on's structures and means of assembly.)
2. Support the same properties being exported in the same places and as the same names in Blender 5.0+ as they do when
   exported from Blender 4.5 plus does.
3. The only export type we care about is glTF. (Custom properties will be enabled.) (Examine all of the types of objects
   that the FPE Blender Add-on applies custom properties to, and how it does it.)

## Executive summary

In Blender 5.0, a breaking Python/RNA storage change decoupled **runtime-defined properties** (anything created via
`bpy.props`, including `PointerProperty`→`PropertyGroup` add-on data) from the **user “Custom Properties”** container (
IDProperties, accessed via `id["key"]`, `id.keys()`, `id.items()`). As a result, exporters that only look at
IDProperties suddenly stop seeing add-on property-group values, even though those values still exist and show correctly
in Blender’s UI. citeturn5search2turn5search1

This aligns exactly with how the built-in glTF exporter collects custom properties: it iterates `blender_element.keys()`
and reads values via `blender_element[custom_property]`, meaning it only exports data that lives in the IDProperty
container. citeturn13view0

Your uploaded add-on (Folded Paper Engine) stores most gameplay metadata in
`bpy.props.PointerProperty(type=...PropertyGroup)` fields (e.g., `bpy.types.Object.fpe_context_props`,
`bpy.types.Scene.fpe_scene_context_props`). fileciteturn2file3L8-L23 That pattern becomes invisible to “export
custom properties” paths in Blender 5.0+ unless you *also* write a mirror of the data into IDProperties before export.

The practical fix is to **serialize your PropertyGroup data** (via RNA introspection/attribute access) into **exportable
IDProperties** (or a JSON string stored in an IDProperty) and optionally clean up after export. For glTF you can
integrate cleanly via the exporter’s pre/post export callback hooks (`glTF2_pre_export_callback`,
`glTF2_post_export_callback`) that the glTF add-on collects from enabled add-ons and runs around the export pipeline.
citeturn30view0turn19view0

## Reproduction with a minimal add-on and scene

The goal is to show: **property is present in session/UI** but **absent from export** in Blender 5.0+ unless mirrored
into IDProperties.

### Minimal reproducible add-on

Create a file `demo_export_props.py` and install/enable it as an add-on:

```python
bl_info = {
    "name": "Demo Export Props Regression",
    "author": "Demo",
    "version": (1, 0, 0),
    "blender": (4, 5, 0),
    "category": "Object",
}

import bpy

class DemoPG(bpy.types.PropertyGroup):
    demo_bool: bpy.props.BoolProperty(name="Demo Bool", default=True)
    demo_float: bpy.props.FloatProperty(name="Demo Float", default=1.23)

def register():
    bpy.utils.register_class(DemoPG)
    bpy.types.Object.demo_pg = bpy.props.PointerProperty(type=DemoPG)

def unregister():
    del bpy.types.Object.demo_pg
    bpy.utils.unregister_class(DemoPG)
```

### Minimal scene actions

1. Start Blender, add a Cube, select it.
2. In the Python Console:

```python
import bpy
obj = bpy.context.active_object

# Runtime-defined add-on properties (PointerProperty → PropertyGroup)
obj.demo_pg.demo_bool = True
obj.demo_pg.demo_float = 9.87

# User Custom Property (IDProperty) for comparison
obj["demo_idprop"] = "I export"
```

3. Export glTF with “Custom Properties” enabled.

### Exact glTF export snippet

The glTF exporter’s UI label “Custom Properties” corresponds to `export_extras` in the operator properties, described as
“Export custom properties as glTF extras”. citeturn16view0

```python
import bpy, os, tempfile
out = os.path.join(tempfile.gettempdir(), "demo.glb")

bpy.ops.export_scene.gltf(
    filepath=out,
    export_format='GLB',
    use_selection=True,
    export_extras=True,
)
print("Wrote:", out)
```

### Expected exported result

In Blender 5.0+, the exported glTF `extras` will include `demo_idprop` but **not** `demo_pg` (nor its inner fields),
because `demo_pg` lives in the runtime-defined property store, not the IDProperty dict that `keys()` enumerates.
citeturn5search2turn5search1turn13view0

In Blender 4.5, the older behavior (runtime `bpy.props` data being stored in the same container as custom properties)
could make this appear to work accidentally for some add-ons and some storage patterns. Blender 5.0 explicitly removes
that “dict-like” access path. citeturn5search2turn5search1

## What changed in Blender 5.0 for custom property storage

### Separation of runtime-defined properties vs user Custom Properties

Blender 5.0 release compatibility notes (and downstream add-on breakage reports quoting them) state that properties
defined through the `bpy.props` API are no longer stored in the same container as user-defined Custom Properties, and
therefore can’t be accessed through the dict-like (`id["prop"]`) interface. citeturn5search2turn5search1

This is the key behavioral shift that breaks “export custom properties” for add-ons that relied on
`PointerProperty(PropertyGroup)` data being export-visible.

### Some types also reduced/removed IDProperty support

Beyond the container separation, Blender 5.0 also removed IDProperties support on some RNA types used by add-ons (
example breakage reports mention `AddonPreferences` losing IDProperties support, causing “this type doesn't support
IDProperties”). citeturn5search14

This matters if an add-on stores export metadata on “convenient” non-ID datablocks or preferences, expects it to
persist, then exports by reading dict-like keys.

### Evidence your add-on uses the affected pattern

Your add-on registers numerous `PointerProperty(PropertyGroup)` fields on Blender types (Scene/Object/Action/Material).
fileciteturn2file3L8-L23

It also contains code that attempts to clear values via the dict-like deletion path on a `PropertyGroup` instance:

```python
del context_object[self.prop_name]
```

fileciteturn3file0L312-L318

That deletion approach is consistent with “runtime property values were discoverable via dict-like storage” assumptions;
it becomes unreliable in Blender 5.0+ when those values are no longer in the IDProperty container.

## Exporter pipelines and why data disappears

### glTF exporter: “Custom Properties” are exported via IDProperty keys

The Blender-bundled glTF exporter has an `export_extras` option labeled “Custom Properties” (“Export custom properties
as glTF extras”). citeturn16view0

When enabled, it collects extras by iterating `blender_element.keys()` and reading `blender_element[custom_property]`.
citeturn13view0

Because Blender 5.0 moves runtime-defined properties out of the IDProperty dict-like container, `keys()` won’t include
`PointerProperty`→`PropertyGroup` add-on fields anymore, so they simply never enter `extras`.

The exporter *does* include a blacklist for well-known internal properties (`cycles`, `glTF2ExportSettings`, etc.).
citeturn13view0 This blacklist can be another reason properties disappear, but for your case the dominant issue is
storage invisibility, not name filtering.

### glTF exporter supports add-on hooks (important for a clean fix)

The glTF add-on builds `pre_export_callbacks` and `post_export_callbacks` by scanning enabled add-ons for module-level
functions named `glTF2_pre_export_callback` / `glTF2_post_export_callback`, and then passes them into the export
settings. citeturn30view0

During export, it executes those callbacks before and after the main export routine. citeturn19view0

That gives you an official, low-friction integration point to **copy PropertyGroup data into IDProperties just-in-time**
for export, without forcing users to use a custom export operator.

### FBX exporter: exports IDProperties, and may filter runtime properties

The FBX exporter’s custom property emission is built around iterating `bid.items()` and writing values (
string/int/float, some arrays). citeturn31search0

It also computes a set of **runtime RNA property identifiers** (`prop.is_runtime`) and skips keys that collide with
runtime properties. citeturn31search0 This is consistent with the long-standing intent of FBX “custom properties”
being *user/IDProperties*, not “all RNA properties defined by add-ons”.

There are also notes/commits in the add-ons repository history referencing skipping special keys like `_RNA_UI` and
runtime properties to avoid bad exports/reimports. citeturn31search2

### Behavior comparison table

| Topic                                                                                | Blender 4.5 (legacy behavior)                                                                            | Blender 5.0+ (new behavior)                                                                                                      | Export impact                                                                       | Recommended fix                                                                                 |
|--------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Runtime-defined properties (`bpy.props`, including `PointerProperty(PropertyGroup)`) | Could be accessible via dict-like storage in some cases; add-ons sometimes (accidentally) relied on that | Explicitly not stored in the same container as user custom properties; dict-like access removed citeturn5search2turn5search1 | Exporters that enumerate IDProperty keys/items no longer see add-on property groups | Serialize/mirror runtime data into IDProperties before export                                   |
| User Custom Properties (IDProperties: `id["key"]=...`)                               | Stored in IDProperty dict container                                                                      | Still stored in IDProperty dict container                                                                                        | Exporters still see them                                                            | Continue using IDProperties for anything that must export                                       |
| glTF “Custom Properties”                                                             | Exports IDProperty keys as `extras` citeturn13view0turn16view0                                       | Same                                                                                                                             | Runtime props disappear                                                             | Mirror into IDProperties; optionally use glTF pre/post callbacks citeturn30view0turn19view0 |
| FBX “Custom Properties”                                                              | Exports IDProperties; often skips runtime-defined collisions citeturn31search0                        | Same (and runtime data is even less likely to appear in `items()`) citeturn31search0turn5search2                             | Runtime props disappear                                                             | Mirror/flatten/JSON-stringify into IDProperties; ensure exporter option enabled                 |

## Precise diagnoses for your add-on and concrete fixes

### Diagnosis for Folded Paper Engine add-on

Your add-on uses `PointerProperty(PropertyGroup)` on `Scene`, `Object`, `Action`, `Material`, etc. to store almost all
export-relevant metadata. fileciteturn2file3L8-L23 In Blender 5.0+, those values exist and are editable, but they
are not part of the IDProperty dict enumerated by exporters’ “custom properties” code paths.
citeturn5search2turn13view0turn31search0

Additionally, the add-on’s current “clear value” behavior deletes dict entries on a `PropertyGroup` object (
`del context_object[self.prop_name]`). fileciteturn3file0L312-L318 In Blender 5.0+ that deletion may not clear the
actual runtime-defined property value (and the `try/except: pass` hides the failure), making state management and export
mirroring harder to reason about.

Meanwhile, your `FPE_FRAME_EVENTS` keyframing mechanism uses true IDProperties (`obj[prop_name] = value`, with
keyframing via `data_path='["prop_name"]'`). fileciteturn1file0L21-L36 That subset is still export-visible in
Blender 5.0+ and is a good model for “must-export” metadata.

### Fix strategy overview

You have three realistic strategies, in increasing order of “pipeline cleanliness”:

- **Always-mirror strategy (simplest for users):** on every relevant UI edit (or periodically), write a serialized
  snapshot into IDProperties (e.g., `obj["FPE"] = {...}` or `obj["FPE_json"] = "..."`). Then all exporters that export
  custom properties will see it.

- **Just-in-time strategy for glTF (minimal file pollution):** implement `glTF2_pre_export_callback` /
  `glTF2_post_export_callback` in your add-on module to add temporary IDProperties only during export (and remove
  afterwards). This is supported by the glTF exporter plumbing. citeturn30view0turn19view0

- **Wrapper operators (needed if you want temporary behavior for FBX too):** add your own “Export FBX (with FPE props)”
  operator that mirrors, calls `bpy.ops.export_scene.fbx(...)`, then cleans up.

### Recommended implementation pattern: serialize PropertyGroups via RNA, then write IDProperties

The key is: don’t rely on dict-like access to PropertyGroups. Instead, traverse using `pg.bl_rna.properties` and
`getattr(pg, identifier)`.

Below is a focused patch pattern that you can adapt to your codebase. It works in both Blender 4.5 and 5.0+, but only
activates mirroring for 5.0+ to avoid double-exporting data in older versions.

#### Patch: replace “clear value” with `property_unset` when clearing runtime properties

Your current code:

```python
del context_object[self.prop_name]
```

fileciteturn3file0L312-L318

Recommended change (keeps IDProperty deletion as a fallback, but prefers RNA-safe unsetting):

```diff
 class ClearValueOperator(bpy.types.Operator):
     ...
     def execute(self, context):
-        try:
-            context_base = getattr(context, self.context_base) if self.context_base else context.object
-            context_object = get_value_by_path(context_base, self.context_object_path)
-            del context_object[self.prop_name]
-        except:
-            pass
+        context_base = getattr(context, self.context_base) if self.context_base else context.object
+        context_object = get_value_by_path(context_base, self.context_object_path)
+        if context_object is None:
+            return {'CANCELLED'}
+        # Prefer RNA property_unset (works for bpy.props-defined properties)
+        try:
+            context_object.property_unset(self.prop_name)
+        except Exception:
+            # Fallback: delete IDProperty if it exists
+            try:
+                del context_object[self.prop_name]
+            except Exception:
+                pass
         do_redraw_all()
         return {'FINISHED'}
```

Rationale: in Blender 5.0, runtime-defined properties are no longer reliably backed by the same dict-like store as
custom properties. citeturn5search2turn5search1

#### Patch: add a serializer and a stable export key

Add near the top-level of your add-on module:

```python
import json
import bpy

FPE_EXPORT_KEY = "FPE_EXPORT"      # structured dict for glTF (optional)
FPE_EXPORT_JSON_KEY = "FPE_EXPORT_JSON"  # JSON string for FBX friendliness

def _is_blender_5_plus():
    return bpy.app.version >= (5, 0, 0)

def _to_primitive(v):
    # Scalars
    if v is None or isinstance(v, (bool, int, float, str)):
        return v
    # Vectors / colors / mathutils-like sequences
    try:
        return list(v)
    except Exception:
        pass
    # Fallback
    return str(v)

def property_group_to_dict(pg):
    if pg is None:
        return None
    out = {}
    for prop in pg.bl_rna.properties:
        ident = prop.identifier
        if ident == "rna_type":
            continue
        # Optionally skip UI/internal fields
        if ident.startswith("FPE_INTERNAL_"):
            continue

        try:
            val = getattr(pg, ident)
        except Exception:
            continue

        # CollectionProperty
        if getattr(prop, "type", None) == 'COLLECTION':
            out[ident] = [property_group_to_dict(item) for item in val]
            continue

        # PointerProperty
        if getattr(prop, "type", None) == 'POINTER':
            out[ident] = property_group_to_dict(val)
            continue

        out[ident] = _to_primitive(val)
    return out
```

#### Patch: mirror your existing PropertyGroups into IDProperties before export

You have these major roots already registered: fileciteturn2file3L8-L23

- `scene.fpe_scene_context_props`
- `object.fpe_context_props`
- plus several object sub-groups (`fpe_inventory_context_props`, `fpe_trigger_events_context_props`, etc.)
- plus material/action groups

A minimal “export snapshot” mirroring function:

```python
def build_fpe_export_payload(context):
    scene = context.scene
    payload = {"scene": None, "objects": {}}

    # Scene-level
    if hasattr(scene, "fpe_scene_context_props"):
        payload["scene"] = property_group_to_dict(scene.fpe_scene_context_props)

    # Object-level
    for obj in scene.objects:
        obj_payload = {}

        for attr in (
            "fpe_context_props",
            "fpe_scene_events_context_props",
            "fpe_trigger_events_context_props",
            "fpe_inventory_context_props",
            "fpe_speaker_settings_context_props",
            "fpe_character_context_props",
            "fpe_physics_context_props",
            "fpe_ui_element_context_props",
            "fpe_sub_scene_context_props",
            "fpe_player_controls_context_props",
        ):
            if hasattr(obj, attr):
                obj_payload[attr] = property_group_to_dict(getattr(obj, attr))

        if obj_payload:
            payload["objects"][obj.name] = obj_payload

    return payload
```

Then write it into IDProperties (two forms: dict and JSON string):

```python
def write_export_idprops(context):
    if not _is_blender_5_plus():
        return

    payload = build_fpe_export_payload(context)
    if not payload:
        return

    # Put on Scene (and/or a dedicated root Empty if you prefer node-based extras)
    context.scene[FPE_EXPORT_KEY] = payload
    context.scene[FPE_EXPORT_JSON_KEY] = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
```

And cleanup:

```python
def clear_export_idprops(context):
    for k in (FPE_EXPORT_KEY, FPE_EXPORT_JSON_KEY):
        try:
            del context.scene[k]
        except Exception:
            pass
```

### glTF-specific best practice: hook pre/post export callbacks (no workflow disruption)

The glTF exporter collects and calls `glTF2_pre_export_callback` / `glTF2_post_export_callback` from enabled add-ons.
citeturn30view0turn19view0

So you can implement (at module top-level in your add-on):

```python
_FPE_DID_WRITE = False

def glTF2_pre_export_callback(export_settings):
    global _FPE_DID_WRITE
    # Only do work if user enabled "Custom Properties" in glTF exporter
    if not export_settings.get("gltf_extras", False):
        return
    write_export_idprops(bpy.context)
    _FPE_DID_WRITE = True

def glTF2_post_export_callback(export_settings):
    global _FPE_DID_WRITE
    if _FPE_DID_WRITE:
        clear_export_idprops(bpy.context)
    _FPE_DID_WRITE = False
```

This integrates with the stock glTF export pipeline and keeps the `.blend` cleaner by leaving no permanent export-only
IDProperties behind.

### FBX-specific notes

FBX “Custom Properties” are sourced from `bid.items()` and written as typed user properties (string/int/float; some
lists as vectors), and may skip keys colliding with runtime RNA properties. citeturn31search0

Because FBX doesn’t reliably preserve nested dict structure from Blender IDProperties, the **JSON-string IDProperty** (
`FPE_EXPORT_JSON`) is the least lossy cross-tool solution: FBX will export it as a string, and your importer can parse
JSON.

If you want FBX export to also be “just-in-time”, add a wrapper export operator:

```python
class FPE_OT_export_fbx_with_props(bpy.types.Operator):
    bl_idname = "folded_paper_engine.export_fbx_with_props"
    bl_label = "Export FBX (with FPE Props)"

    filepath: bpy.props.StringProperty(subtype="FILE_PATH")

    def execute(self, context):
        write_export_idprops(context)
        try:
            bpy.ops.export_scene.fbx(
                filepath=self.filepath,
                use_custom_props=True,
                use_selection=False,
            )
        finally:
            clear_export_idprops(context)
        return {'FINISHED'}
```

(The key requirement is that FBX export must have the “custom properties” option enabled; the exporter code path only
runs when that setting is on. citeturn31search0)

## Validation tests and workflow guidance

### Tests that validate the fix

A good validation set is:

- **Scene-level:** set a non-default value in your scene PropertyGroup (e.g., `SkyColor`, `Gravity` in your add-on) and
  verify it appears in export. Your UI is driven by `scene.fpe_scene_context_props.*`. fileciteturn3file0L366-L407

- **Object-level:** set a handful of object flags (e.g., `Player`, `Trigger`, `Groups`) and verify they appear in
  export. fileciteturn3file0L411-L488

- **IDProperty keyframes:** confirm your existing IDProperty-based keyframed data (`obj["FPE_FRAME_EVENTS"]`) still
  exports and animates as expected, since it’s already stored as an IDProperty and keyed with the correct data path.
  fileciteturn1file0L21-L36

For glTF, confirm the data lands under `extras` (and only when `export_extras=True`). The exporter option and collection
mechanism are explicit in the glTF add-on code. citeturn16view0turn13view0

### Mermaid data-flow diagram of the break and the fix

```mermaid
flowchart LR
  A[Addon writes data via bpy.props / PointerProperty(PropertyGroup)]
  B[Blender 5.0 runtime-defined property storage]
  C[IDProperties: id["key"], id.keys(), id.items()]
  D[glTF exporter extras: iterates blender_element.keys()]
  E[FBX exporter custom props: iterates bid.items()]
  F[Exported files contain properties]

  A --> B
  B -. no longer visible via dict-like keys/items .-> D
  B -. no longer visible via dict-like keys/items .-> E

  A -->|Fix: serialize & mirror| C
  C --> D --> F
  C --> E --> F
```

### Workflow recommendations

If you want the least user friction (users can export normally):

- Implement the glTF pre/post callbacks so your exported data shows up when users click “Export glTF” normally and check
  “Custom Properties”. citeturn30view0turn19view0turn16view0
- For FBX, either:
  - Keep a **persistent** `FPE_EXPORT_JSON` IDProperty up-to-date (then any export with “Custom Properties” includes
    it), or
  - Provide a dedicated “Export FBX (with FPE Props)” operator that mirrors/cleans up.

If you need interoperability across glTF and FBX, prefer the **JSON string** format as the canonical payload because FBX
custom properties are fundamentally scalar-centric. citeturn31search0