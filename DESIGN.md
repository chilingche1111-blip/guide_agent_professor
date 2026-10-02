---
name: 长安知行 · 智慧校园 AI 助手
description: Official campus photography and a map-relative architectural open-day guide.
colors:
  sky: "#dce5ef"
  ink: "#182d44"
  muted: "#405973"
  paper: "#f4f7fb"
  line: "#9eadc0"
  accent: "#244c9d"
  accent-hover: "#1846b0"
  focus: "#e0ad5b"
  night-sky: "#112338"
  night-ink: "#f2f5fa"
  night-muted: "#bed0e3"
  night-paper: "#172d45"
  night-line: "#4a647f"
  night-accent: "#c4ddff"
  night-accent-hover: "#c9dbff"
  night-action-ink: "#18392d"
  night-action-hover-ink: "#132b48"
  ion-ground: "#071522"
  ion-paper: "#102637"
  ion-text: "#e7f5ff"
  ion-muted: "#a1bfd3"
  ion-line: "#315069"
  ion-accent: "#92e3ff"
  ion-accent-hover: "#caf1ff"
  ion-accent-soft: "#163549"
  ion-hover: "#17364b"
  ion-ready: "#9be7ff"
  ion-processing: "#ffd199"
  ion-send: "#a1e8ff"
  ion-source: "#cde9fa"
  ion-input-line: "#46718d"
  ion-fallback-ring: "#7ec7e5"
  ion-fallback-orbit: "#467c9e"
  ion-orbit-bright: "#70d9ff"
  ion-orbit-muted: "#246387"
  ion-depth-points: "#77b7d3"
typography:
  display:
    fontFamily: '"Campus Noto", "PingFang SC", sans-serif'
    fontSize: "clamp(56px, 6.4vw, 96px)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '"Campus Noto", "PingFang SC", sans-serif'
    fontSize: "clamp(32px, 4vw, 58px)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  body:
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "13px"
    lineHeight: 1.9
  label:
    fontFamily: "Urbanist, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  ion-headline:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "clamp(30px, 3.1vw, 48px)"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  ion-body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "14px"
    lineHeight: 1.9
  ion-label:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
    fontSize: "12px"
rounded:
  map-label: "3px"
  architectural: "4px"
  form: "8px"
  drawer: "14px"
  ion-composer: "12px"
spacing:
  compact: "12px"
  control-gap: "14px"
  section-gap: "20px"
  drawer: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "white"
    rounded: "{rounded.form}"
    padding: "13px 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "white"
  button-primary-night:
    backgroundColor: "{colors.night-accent}"
    textColor: "{colors.night-action-ink}"
    rounded: "{rounded.form}"
    padding: "13px 18px"
  button-primary-night-hover:
    backgroundColor: "{colors.night-accent-hover}"
    textColor: "{colors.night-action-hover-ink}"
  service-chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.architectural}"
    padding: "10px 15px"
  service-chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.sky}"
  map-label:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.map-label}"
    padding: "8px 12px"
  place-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.architectural}"
    padding: "30px 26px"
    width: "330px"
  assistant-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.drawer}"
    padding: "{spacing.drawer}"
    width: "min(430px, calc(100% - 32px))"
  ion-motion-control:
    textColor: "{colors.ion-text}"
    typography: "{typography.ion-label}"
    rounded: "{rounded.architectural}"
    padding: "0 8px"
  ion-motion-control-hover:
    backgroundColor: "{colors.ion-hover}"
  ion-composer:
    backgroundColor: "{colors.ion-paper}"
    textColor: "{colors.ion-text}"
    rounded: "{rounded.ion-composer}"
  ion-send:
    backgroundColor: "{colors.ion-send}"
    textColor: "{colors.ion-ground}"
---

# Design System: 长安知行 · 智慧校园 AI 助手

Naming: product “长安知行”; subtitle “智慧校园 AI 助手”; conversational persona “知行”. Use the full product name for browser titles, navigation identity and exported file names, and the short persona for greetings, message attribution and ready status. Keep “长安大学 · 课程项目” and non-official-service boundaries. Historical “校伴” evidence is retained, not silently relabeled.

## Overview

**Creative North Star: "The Architectural Campus Open Day"**

Official Chang'an University photographs establish a recognizable campus before a sliding image curtain reveals the architectural model. Slate-blue grounds, pale reading surfaces, precise rules, and large Chinese titles give the experience the character of a campus exhibition. Four chapters connect photographs, camera compositions, and service navigation; the Agent remains directly accessible from the header and contextual questions.

The model represents Weishui campus's relative layout from the official Ver.2023 map, published in 2024. Photographs, simplified geography, and simulated service records have distinct provenance. This is a course demonstration, not an official school service or a measured navigation map. Visual authority is the current cascade of `02_Python_Version/static/campus.css` followed by `campus-experience.css`, with `index.html`, `campus.js`, `campus-layout.js`, and `campus-world.js` supplying content and behavior.

**Key Characteristics:**

- Seven official photographs, four chapters, and seven photo-backed landmarks connect campus identity with exploration.
- A slate-blue architectural model preserves source-based relative geography.
- Local Chinese display glyphs pair with Urbanist Latin labels and system body text.
- Small rectangular controls, ruled directories, and quiet paper panels support the model.
- A persistent same-document Agent workspace retains conversation and draft continuity.
- A user-requested JARVIS-like ion core gives the assistant a deep-blue, cyan-particle identity and yields space to the conversation.

The assistant adds a scoped visual world inside the existing Agent: an immediately usable greeting, procedural three-dimensional core, and real question composer. Its authority is the opening design contract in `workbench.html`, with `ion-assistant.css` after the existing workbench cascade and `ion-assistant.js` responding to `app.js` state. This addition preserves the campus system and all seven campus entrances.

## Colors

### Primary

**Accent** supplies cobalt actions; **accent-hover** is the existing day primary-button hover. **Focus** is the warm gold keyboard outline. Photo overlays use deep blue gradients behind white introductory text and pale action surfaces.

### Neutral

**Sky** is the slate-blue ground, **paper** supports reading, **ink** carries primary content, **muted** carries explanations, and **line** defines controls and separators. Night is the initial page state and replaces all six roles together. Service chips invert ink and sky on selection; night primary buttons have explicit default and hover text pairings.

**The Coupled Theme Rule.** Change foreground, surface, action, and hover assignments together when switching between day and night.

### Assistant surface extension

The ion-prefixed tokens apply only to the assistant chat surface, which retains its deep-blue ground under either workspace theme. Cyan accents mark actions, focus, ready status, and orbital geometry; pale text and muted blue explanations remain readable over the dark field. Warm processing color appears with the actual busy state. The composer uses its own paper and border roles. These are intentional additions to the campus palette, not replacements for its day/night assignments.

## Typography

Chinese display titles use locally hosted **Campus Noto**, a 17KB Noto Sans SC subset with a supplied 600-weight face and SIL OFL license. Current title selectors request weight 500; the browser uses the available face. The subset covers fixed display copy, with system fallbacks for other glyphs. **Urbanist** is locally hosted at weight 600 for Latin labels, identity details, and the faint EXPLORE word. Body text uses PingFang SC / Microsoft YaHei.

The frontmatter display and headline roles describe the photo title and chapter title. Photo introduction text is 16px at 1.95 line height; place titles are 31px, guide headings 26px, and provenance 11px. Directory titles scale from 30px to 64px; rows scale from 18px to 26px. At 640px, photo/chapter/place/guide titles become 52/26/25/22px. Map search and assistant inputs become 16px. Documents remain selectable, wrap long strings, and retain the existing maximum reading measure of 75ch.

The ion roles inherit the existing workbench Inter/system sans-serif stack; they introduce no font download. The two-line assistant greeting uses ion-headline. Supporting copy uses ion-body with a 30ch maximum; status uses 14px and controls use ion-label. At the assistant's 760px breakpoint the heading is 30px, model copy is 12px, and the interaction hint is 11px. Conversation mode hides the greeting and explanatory paragraphs while retaining readable status. This scoped type scale is intentional alongside the campus display system.

## Layout

The photo and map share a stage of `max(820px, 100svh)`, an 88px header, and 4% desktop side gutters. Four chapter controls occupy the bottom edge, with a horizontal service strip and source link above. Search/view controls sit upper left; photograph/directory actions sit upper right. Desktop map insets stay at 210px 4% 225px when a panel opens. The place panel is 330px wide and scrolls internally.

The elongated relative plan retains library, teaching, dining, sport, arts, clinic, roads, lake, and test-track context. Seven photograph-backed landmarks define the interactive scope: Yifu Library, Xiuyuan teaching building, the western Hongxiangyuan living community, Chang'an Cultural Arts Centre, 公路学院组团 (highway), 建工·材料学院组团 (materials), and 信息·交通学院组团 (information). The last three consolidate college and laboratory buildings into exploratory groups. The information/transport group's position is indicative, not a verified building entrance; its photo depicts the Information Engineering building. Other physical forms remain non-interactive map context. Twenty-three representative dormitory blocks express three living groups, not an asserted physical building count; only the photograph-backed western community receives a living entry. Search and directory contain these seven photo destinations. The Agent's broader service capabilities remain available in its workspace without implying connection to live university business systems.

The viewport-sized native `dialog` directory uses three groups: 求知之间 (library and study), 学院与实验室 (highway, materials, and information), and 生活与文化 (life and activities), containing two, three, and two entries respectively. Its three-column desktop composition becomes one column on mobile. These directory groups are distinct from the four exploration chapters. It does not request browser Fullscreen API mode. The compact guide below the stage caps its document list at 248px and links to the knowledge workspace.

At 1000px, header and toolbar spacing tighten and the place panel becomes 310px wide. At 640px, the stage is `max(760px, 100svh)` with 6% gutters and two-column chapter navigation. Search and view controls occupy separate rows; scene controls become a horizontal row of 44px buttons. Map insets remain 300px 0 350px in both selection states. The panel uses insets 282px 6% 275px and hides the scene controls while open, leaving source and service navigation below. The icon-only assistant launcher sits at the campus surface's bottom right. Existing 1600px and 701px minimum rules adjust the wide layout and map-source placement.

The assistant entry stage uses a 40% greeting / 60% core grid with a 370px minimum height and a 360px core field. Side padding scales from 20px to 64px. The ruled control row spans both columns; task shortcuts and the real composer follow without a blocking introduction. Messages and composer cap at 900px. At 760px, the greeting and 180px core stack with 18px side padding; controls wrap and keep a 44px minimum target. Once messages exist, the stage reduces to a 96px minimum, status plus a 130px-wide/100px-high core (100px wide on mobile), and a compact control row. The input, answers, references, and stop action remain in the existing workspace flow.

## Elevation & Depth

Photographic light, matte model geometry, perspective, and static directional shadows supply depth. Navigation and place panels remain flat. Map labels use `0 4px 12px #0002` and a fine stem; search results use `0 12px 32px #142e5026`; the retained assistant drawer uses `0 20px 80px #153f4555`. These treatments are component-specific.

**The Stable Canvas Rule.** Keep canvas bounds unchanged when a place panel opens; move the camera and project labels within the existing scene.

Repeated geometry is instanced; static shadows refresh on initialization/theme changes. Camera movement uses requestAnimationFrame until convergence, with cached dimensions and transform-projected labels. Rendering stops when settled, covered by the photograph or Agent, offscreen, or in a hidden document. This is implementation behavior, not a physical-device 60fps guarantee; evidence and limitations are in `06_Demo/WEISHUI_MAP_OPTIMIZATION.md`.

Assistant depth comes from additive point geometry, three tilted orbital lines, and 200 quiet background points. No bloom post-processing buffers are used; the composer has no focus shadow. At initialization, the core allocates 4,800 points on desktop or 2,200 at widths up to 760px, with pixel ratio capped at 1.5 or 1.2 respectively. These are allocation limits, not measured frame-rate claims. A 750ms cubic-eased gathering runs when the core becomes active; reduced motion draws the assembled core immediately. Its continuous renderer pauses when the chat/Agent is hidden, the stage is offscreen, the document is hidden, motion is paused, or context is lost.

## Shapes

Architectural controls and panels use 4px corners; map labels use 3px corners. Chapter tabs and directory rows are open ruled compositions. Directory/place photographs use 4px corners. The retained light-question button and textarea use 8px corners; the assistant drawer uses 14px corners. The header day/night control remains circular. Preserve the distinction between architectural navigation and assistant forms.

The ion core and fallback use spherical and orbital geometry. Assistant motion controls retain architectural corners, task shortcuts are unboxed, and the composer uses the dedicated ion-composer radius. Its fine border changes to ion-accent on focus.

## Components

### Photographic opening and chapter navigation

Seven source-linked official photographs support seven destinations. The four chapter photographs show the library, Xiuyuan teaching building, Hongxiangyuan living community, and cultural arts centre. Three additional destination photographs show the highway infrastructure platform, the architectural experimental centre's real interior atrium, and the Information Engineering building exterior. The four chapters remain unchanged; the learning chapter includes library, study, and the three college groups. A 600ms transform curtain reveals the preserved model. Each chapter updates title, service strip, and camera composition; photograph mode shows its image. Chapter buttons expose selected state and support arrow keys, Home, and End.

Attribution links follow the displayed photograph: the highway and materials images link to the university Infrastructure Office's [platform archive](https://jjc.chd.edu.cn/2018/1109/c747a52265/page.htm) and [experimental-centre archive](https://jjc.chd.edu.cn/2018/1109/c747a52266/page.htm); the information image links to the [official teaching centre](https://ticvse.chd.edu.cn/info/1010/1376.htm). Retain archive wording for historic photographs. The atrium image must be identified as an interior, and the information building photo must not imply that all grouped departments share one exact building or entrance.

### Actions, fields, and service chips

The pale exploration action has 4px corners, a 56px minimum height, and a widening arrow gap on hover. Header Agent entry is a separate pale action. Retained filled primary buttons use day/night pairings from the frontmatter. Keyboard focus uses a 3px gold outline offset by 4px; disabled buttons use 0.65 opacity and a waiting cursor. Search uses a bordered paper field with 4px corners. Service chips have a 44px minimum height and ink/sky inversion on hover or selection.

### Map labels and place panel

HTML labels are keyboard-operable and collision-aware. Only the seven photo-backed destinations listed in Layout are interactive. Other buildings retain their map-relative background geometry but have no labels or service entries. No photograph is substituted for an unverified landmark; absence of a supported photograph means no interactive entry. Group labels describe an exploratory collection, not a precise office or building-door location.

Landmark entry is a matched cinematic cut, not a thumbnail in a popup: the camera pushes toward the selected building, a predecoded image becomes the full-surface background through a 760ms scale/opacity transition (100ms overlap delay), and service content appears after 320ms over a directional readability scrim. Consecutive destinations crossfade between two image layers over 620ms. Return fades out in 420ms and restores the saved map pose, rather than resetting it. Rapid switches and early returns invalidate stale image/animation completions; reduced motion preserves the photo/content state without spatial movement. A photo-loading failure keeps the ordinary map service panel as an explicitly announced fallback.

The photo scene uses a large white title, a location line below it, previous/next controls, descriptive text and Agent action on an unboxed left composition. Simulated quick-reference controls stay out of this scene; the full workbench remains available. Source credit and a full-photo link remain visible. `landmark-film.css` is the final photographic-state layer after the incumbent styles, and `landmark-film.js` owns interruptible transitions.

### Directory and documents

The native modal directory has photographic group headers, ruled destination buttons, Escape/close support, and native focus behavior. Its reveal uses a 500ms clip-path animation. Native `details` / `summary` powers documents, with plus/minus guide markers. These HTML routes remain available without WebGL.

### Assistant and Agent workspace

The lightweight assistant is a non-modal `aside` with status, live log, source labels, textarea, optional web search, and workbench link. Opening focuses the input; closing restores the opener. The full Agent mounts once in same-document Shadow DOM. Its 300ms entrance / 240ms return animate live layers, preserve the canvas and history, and support reversal. Place handoff selects the school knowledge context and appends the suggested question to an existing draft without automatic sending. Mobile entry does not summon the keyboard.

Reduced-motion preference defaults the scene to paused, suppresses CSS motion/smooth scrolling, and switches Agent views directly; users retain explicit scene-motion controls. Initialization/context-loss fallbacks keep HTML navigation and the workspace route available.

### Interactive ion assistant

The core supports pointer response, drag rotation, arrow-key adjustment, Home/reset view, and pause/resume. Vertical touch scrolling remains available. Reduced-motion preference disables the automatic-motion toggle and shows an assembled static core; keyboard view adjustments remain available. Status reads “知行，准备就绪” when idle and “正在处理你的问题” only while the existing request is busy. Busy state raises particle energy, warms selected particles, and accelerates one orbit. This is request-state feedback, not microphone activity, scientific ion simulation, model reasoning telemetry, or evidence of answer quality.

Model text distinguishes local knowledge mode from configured model mode and explicitly defers to actual request results. The status synchronizer lives in the main app so it also works when the optional 3D module cannot load. Renderer initialization failure, module-load failure, and WebGL context loss display a static orbit illustration with a truthful explanatory hint, hide unavailable 3D controls, and keep normal question submission. Restored WebGL context restores interaction. The live composer, busy/stop behavior, sources, draft, and conversation history remain authoritative.

Visual evidence is recorded in `06_Demo/screenshots/ion-assistant/`: `desktop.png`, `mobile.png`, `conversation.png`, and `fallback.png`, with additional module-failure and context-loss/restoration captures. Screenshots establish captured appearance and states; they do not establish physical-device FPS or real-provider answer quality.

## Do's and Don'ts

- Do keep official-photo attribution, map provenance, and simulated-service labels distinct.
- Do preserve the relative Ver.2023 map layout and each selected location's camera target.
- Do limit interactive map/search/directory entries to the seven photograph-backed landmarks.
- Do match each photograph to its own source link and distinguish archive exteriors, the real atrium interior, and indicative college-group positions.
- Do retain day/night foreground and hover pairings together.
- Do keep mobile panels clear of the source link and service strip.
- Do preserve keyboard navigation, reduced motion, and usable HTML routes without WebGL.
- Do scope ion palette and typography to the assistant, collapse the core when messages appear, and preserve the seven campus entrances.
- Do couple ion busy/ready feedback to actual request state and preserve truthful status and question submission in static fallbacks.
- Don't present the model as GPS, current surveying, or a real navigation service.
- Don't equate the 23 representative dormitory blocks with the physical building count.
- Don't attach the Hongxiangyuan photo to the eastern living community or a south-campus stadium photo to Weishui.
- Don't present college-group locations as exact building entrances or imply live university business integration.
- Don't replace the campus experience with a dominant chat form or resize its canvas for a panel.
- Don't turn software-rendered benchmark evidence into a physical-device performance guarantee.
- Don't imply microphone listening, live model telemetry, or answer quality from the ion animation or configured-model label.
