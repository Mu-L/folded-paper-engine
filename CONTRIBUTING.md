# Contributing to Folded Paper Engine

First off: thank you for wanting to help Folded Paper Engine (FPE) grow.

FPE is a **Blender → Godot pipeline** focused on making level and gameplay creation “as easy as a few clicks” for indie teams and solo creators. :contentReference[oaicite:0]{index=0}

This document explains how we work, how to propose changes, and how we keep the project on track.

---

## Project direction

FPE has a fairly opinionated vision:

- Keep the Blender → Godot workflow **simple, predictable, and designer-friendly**.
- Prefer **small, composable features** over one-off, highly specific systems.
- Prioritize **stability and clarity** over “cleverness”.

The **core maintainers** (Papercraft Games / project owners) are ultimately responsible for:

- Deciding which features land and when.
- Keeping the API, UX, and architecture coherent.
- Saying “no” (or “not now”) when a change doesn’t fit the roadmap.

We absolutely want feedback and contributions, but **we’re not looking for community “co-owners” of direction**. Think “collaborators on a focused tool,” not a wide-open framework.

If you’re ever unsure whether an idea fits, please open a **discussion or issue _before_ writing a lot of code.**

---

## Ways to contribute

- **Bug reports** – broken behavior, confusing UX, crashes, etc.
- **Feature requests** – especially when tied to real workflows (“I’m trying to do X in Blender / Godot…”).
- **Documentation** – clarifications, examples, typo fixes, screenshots.
- **Small code changes** – focused improvements that plug into the existing architecture.
- **Test scenes / sample projects** – small projects that demonstrate real-world use.

You don’t need to write code to be a valuable contributor.

---

## Issues, features, and triage

We use GitHub Issues and labels to stay organized.

### Before opening an issue

1. **Search existing issues and discussions.**
2. If you’re not sure whether something is a bug or a misunderstanding, use a **“question”** / **“discussion”** first when possible.

### When you file an issue

Please include:

- **Environment** (OS, Blender version, Godot version, FPE version).
- **What you did** (exact steps, sample .blend/.tscn if possible).
- **What you expected** vs **what actually happened**.
- Screenshots or a short screen capture if that makes it clearer.

### Labels we typically use

Maintainers will re-label as needed, but these are the rough buckets:

- `bug` – incorrect behavior, crashes, regressions.
- `enhancement` – feature requests and improvements.
- `docs` – documentation, examples, guides.
- `question` – “how do I do X?” or “is this supported?”.
- `good first issue` – smaller, well-scoped tasks for new contributors.
- `needs design` – requires architectural / UX decisions from maintainers.
- `security` – security or safety-sensitive topics (see Security below).

Issues are generally handled in this order:

1. **Crashes / data loss / security.**
2. **Regressions and broken core workflows.**
3. **High-impact enhancements that align with the roadmap.**
4. Everything else, as time and capacity allow.

---

## Pull requests

We love PRs. To keep the project healthy, we have a few strong preferences.

### 1. Keep PRs small and focused

- One **logical change** per PR (or one tightly related group of changes).
- Avoid “drive-by refactors” and “while I’m here I also rewrote…”.
- If your change touches many files or multiple subsystems, it’s almost certainly **too big**.

Small PRs are **far more likely** to be reviewed and merged quickly.

### 2. Talk to us before big work

If you want to:

- Introduce a **new major feature**.
- Change **core architecture** or data formats.
- Deprecate or remove existing behavior.

Please **open an issue or GitHub Discussion first** and outline:

- The problem you’re solving.
- Your proposed approach at a high level.
- Any alternatives you considered.

We’ll help:

- Confirm it fits the project’s direction.
- Point you at existing utilities / patterns that you should reuse.
- Call out edge cases (import behavior, UX in Blender, Godot scenes, etc.).

This saves everyone from large PRs that can’t be merged.

### 3. Align with existing architecture

When coding:

- Prefer using the **existing utilities, patterns, and node types** rather than inventing new ones.
- Follow the current layout for:
  - Blender panels & properties.
  - Godot nodes & scripts.
  - Import pipeline hooks.
- If you need a new abstraction, explain **why** in the PR description.

If your change duplicates existing functionality in a slightly different way, it will probably be rejected or heavily revised.

### 4. Tests, docs, and samples

When applicable:

- **Add or update tests** to cover your change.
- **Update documentation**:
  - Blender panel docs.
  - Godot usage docs.
  - Any relevant FAQs or tutorials.
- Consider adding a **small sample scene** that demonstrates the feature.

If you change something user-visible but don’t update docs, a maintainer will likely ask you to add that before merging.

### 5. PR checklist

A good PR generally:

- Explains **what** and **why** in the description.
- References related issue(s) (`Fixes #123` / `See #123`).
- Includes tests/docs/samples when appropriate.
- Doesn’t mix unrelated changes.

Maintainers may push small follow-up commits (naming, comments, tiny cleanups) as part of the review.

---

## Code style and licensing

- Follow the **existing code style** in the file(s) you’re touching (both for Python and GDScript).
- Keep naming and structure consistent with nearby code and current docs.
- All contributions are made under the project’s **MIT License**. :contentReference[oaicite:1]{index=1}  
  By submitting a PR, you’re agreeing that your code can be distributed under that license.

If you’re unsure about style, don’t stress too much — we can iterate in review.

---

## Security and safety

If you believe you’ve found a **security issue** (e.g., something that could lead to arbitrary code execution, data exfiltration, or other serious abuse):

- **Do not** open a public issue with full details.
- Instead, please contact the maintainers privately (see the repo README / project website for contact info), with:
  - A short summary of the problem.
  - Steps to reproduce (or a minimal example).
  - Any thoughts on impact and possible fixes.

We’ll coordinate a fix and a responsible disclosure.

For less severe “safety & robustness” issues (e.g., malformed data crashing an import), opening a public bug is fine — just tag it clearly if you think it’s security-adjacent.

---

## How decisions are made

- Maintainers review issues and PRs regularly, but this is an **open-source project maintained in limited time**.
- We may:
  - Request changes.
  - Suggest a different direction.
  - Defer or close requests that don’t fit the roadmap.

Disagreement is normal; please keep discussions respectful.

If something is closed and you strongly disagree, you’re welcome to continue the conversation in a calm, technical way — but the maintainers’ decision on project direction is final.

---

Thank you again for helping make Folded Paper Engine better for everyone 💛
