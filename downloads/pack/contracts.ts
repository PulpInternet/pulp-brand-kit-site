// Pulp Brand Kit 2026, v6d-LibreFranklin. Generated from the kit's source; edit the source, not this file.

// ---------------------------------------------------------------- house
type PropertyId = 'typodojo' | 'pulp' | 'thinkwell' | 'publishing';
type Dial = -1 | 0 | 1;          // less formal, the house, more formal

type Property = {
  id: PropertyId;
  dial: Dial;                    // publishing sits at 0
  endorsement: 'A Pulp special project' | 'A Pulp product'
             | 'Published by Pulp' | null;   // Pulp signs itself
  signature: 'typo' | 'gum-robot' | 'tw-cloud' | null;
  set: Partial<DialParameters>;  // all else resolves to Pulp (R-HOUSE-03)
};

type DialParameters = {
  displayFace: FaceName;  readingFace: FaceName;
  case: 'lower' | 'caps-hero' | 'sentence';
  headlineEnds: 'period' | 'period-on-statements' | 'none';
  radii: number[];        accentBudget: 0 | 1;
  character: 'typo' | 'gum-robot' | null;
  texture: 'prints' | 'plates' | 'none';
  motion: 'self-draw' | 'highlight-sweep' | 'state-rings';
  density: 'card' | 'column' | 'panels';
  voice: 'warm' | 'essay' | 'exact';
};

// The ten invariants are not parameters. Nothing sets them.
declare const INVARIANTS: readonly string[];
type Invariant = typeof INVARIANTS[number];

// ---------------------------------------------------------------- marks
type MarkId =
  | 'pulp-wordmark' | 'pulp101-lockup' | 'pulp101-seal'
  | 'pulp-api-lockup' | 'pulp-api-glyph'
  | 'loosethreads-lockup' | 'loosethreads-glyph'
  | 'tw-lockup' | 'tw-cloud' | 'dojo-t';

type Mark = {
  id: MarkId;
  fill: 'noir' | 'newsprint';  // by ground; never a color
  cloud?: '#C361BC';            // tw-cloud and tw-lockup only
  clearSpace: 0.5;              // times the mark's height, all sides
  minWidth: { screenPx: number; printMm: number };
  trademark: 'top-right' | 'none';
};

const PULP_WORDMARK: Mark = {
  id: 'pulp-wordmark', fill: 'noir', clearSpace: 0.5,
  minWidth: { screenPx: 72, printMm: 20 }, trademark: 'top-right',
};

const PULP101_LOCKUP: Mark = {
  id: 'pulp101-lockup', fill: 'noir', clearSpace: 0.5,
  minWidth: { screenPx: 120, printMm: 32 }, trademark: 'top-right',
};

type PlatformMark = {
  id: 'pulp-api-lockup' | 'pulp-api-glyph'
    | 'loosethreads-lockup' | 'loosethreads-glyph';
  inks: ('--c-type' | '--c-thread' | '--c-dye')[]; // grays in mono
  smallCut: 'LT-c' | 'flat';     // 32 px and under
};

type Endorsement = {
  text: 'A Pulp special project' | 'A Pulp product'
      | 'Published by Pulp' | 'Part of the Pulp platform';
  face: 'property-reading-face'; // never Libre Franklin inside a property
  size: 'label';
  place: 'under-mark' | 'after-mark' | 'footer';
};

// ---------------------------------------------------------------- bot
type BotPlacement = 'hero' | 'cta-peek' | 'about' | '404' | 'merch';

type GumRobotUse = {
  property: 'pulp';              // never 'thinkwell' or 'typodojo'
  placement: BotPlacement;
  perScreen: 1;                  // at most
  widthPx: number;               // >= 96; hero <= 40vw
  line: 'noir' | 'newsprint';   // by mode
  face: 'ground';                // the face fill matches the ground
  motion: 'still' | 'blink' | 'peek';
  blinkEveryMs?: number;         // >= 8000, never loops
  peekMs?: 480;                  // arrive easing, then stays
  speaks: false;                 // no lines, ever
  framedAs: 'calm-help';         // never watching or listening
  besideFace: false;
  asPersona: false;
};

// typodojo's Typo has its own contract in the typodojo repo.
// He speaks, can Rest, and never leaves typodojo.  (R-HOUSE-04)

// ---------------------------------------------------------------- color
type Hex = `#${string}`;
type Ground = 'newsprint' | 'noir' | 'carbon-copy' | 'pulp-stock' | 'bubble';

type ColorToken = {
  token: string;                 // --pulp-<token>
  hex: Hex;
  tier: 'neutral' | 'tint' | 'accent' | 'context' | 'property';
  owner?: 'Damani' | 'Uday' | 'Wen' | 'Nicole' | 'Hannah' | 'Alan' | 'Rifaz' | 'Milana' | 'Pat';
  role: string;                  // one job
  never: string;
  scope: PropertyId[];
  contrast: Record<Ground, number>;  // measured, WCAG
  textOn: Ground[];              // only where contrast >= 4.5
};

type AccentBudget = {
  pulp: 1;        // resting highlights per page; one accent per object
  publishing: 1;  // per part, plus one accent per object
  thinkwell: 1;   // per palette
  typodojo: 0;    // none, ever
};

const RETIRED: Hex[] = ['#DA6FD5'];

// ---------------------------------------------------------------- modes
type Mode = 'light' | 'dark' | 'mono';  // Thinkwell: mono is 'Black'

type ModeTokens = {
  ground: Hex; type: Hex; muted: Hex; line: Hex; band: Hex;
  card: Hex; btnBg: Hex; btnFg: Hex; link: Hex; plate: Hex;
  accent?: Hex;                  // Thinkwell only
  print?: Hex;                   // Pulp only: 1.08 to 1.25:1 on what it sits on
};
type PropertyModes = Record<Mode, ModeTokens>;

// The switch test (R-MODE-02)
type SwitchTest = (page: string, a: Mode, b: Mode) => {
  sameBoxes: true;               // every element, same x, y, w, h
  sameElements: true;            // nothing appears or disappears
  grayscaleShapeDiff: 0;
};

// Order of choice: system setting, then the saved choice.
type ModeSource = 'system' | 'saved';

// ---------------------------------------------------------------- type
type FaceName = 'Libre Franklin' | 'Albert Sans' | 'Instrument Sans'
              | 'Typo Display' | 'Recursive Casual';

type TextRole = 'display' | 'hero' | 'heading' | 'title' | 'subhead'
              | 'body' | 'label' | 'caption' | 'number' | 'tick';

type TextSpec = {
  role: TextRole;
  face: FaceName;                // from the property's position
  weight: 400 | 500 | 600 | 700 | 800;
  size: { desktop: number; tablet: number; phone: number };
  lineHeight: number;
  case: 'lower' | 'sentence' | 'upper';
  trackingEm?: number;           // labels 0.1 to 0.16
  whenLong: 'wraps' | 'clamp-2' | 'clamp-3' | 'truncate-1' | 'never';
  tabular?: true;                // numbers
  italic: false;                 // always
};

// ---------------------------------------------------------------- layout
type Space = 0 | 2 | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 56 | 64 | 96;

type Radius = {
  typodojo: 8 | 12 | 24 | 999;
  pulp: 0 | 6 | 999;
  thinkwell: 2 | 4 | 6 | 10 | 16 | 24;
};

type Widths = { column: 680; frame: 1180 | 1240; gutter: 24 | 16 };
type ZIndex = 45 | 50 | 80;      // rail, bar, modal
type CheckWidth = 320 | 390 | 768 | 1024 | 1280 | 1440 | 2000;

type Target = {
  minPx: 44;                     // touch, < 1024 wide, < 500 tall
  floorPx: 24;                   // anywhere
  gapPx: 8;                      // between two targets
};

type Page = {
  sidewaysScroll: false;
  nestedScroll: false;
  barsAlignToColumnPx: 2;
};

// ---------------------------------------------------------------- components
type ControlHeight = 24 | 32 | 40 | 44;

type Button = {
  kind: 'primary' | 'secondary' | 'link';
  height: ControlHeight;
  shape: 'pill' | 'r10';         // pill: Pulp, typodojo. r10: Thinkwell
  primaryPerView: 1;
};

type FloatingView = {
  desktop: 'modal'; phone: 'sheet';
  dimsPage: true;
  closesOn: ['outside', 'close', 'Escape'];
  returnsFocus: true;
};

type StepState = 'done' | 'now' | 'next';
const STEP_OPACITY = { done: 0.55, now: 1, next: 0.75 };

type ScreenState = 'loading' | 'empty' | 'offline' | 'error'
                 | 'long' | 'short';      // every screen draws all six

// ---------------------------------------------------------------- imagery
type ImageKind = 'photo-person' | 'photo-object' | 'plate'
               | 'symbol' | 'icon' | 'print' | 'product';

type Image = {
  kind: ImageKind;
  format: 'vector' | 'raster';   // raster only for photos
  treatment: 'sharp' | 'pointillist';   // fixed, never morphs
  credit?: string; license?: string;    // every photo
  consentOnFile?: true;          // every photo of a person
  plainLabel?: string;           // plates that carry meaning
};

type SymbolId = 'gum-robot' | 'human-interfaces' | 'critical-decisions'
  | 'persona-engine' | 'machine-health' | 'attention' | 'community'
  | 'missing-piece' | 'verified-people' | 'consent' | 'reflection'
  | 'one-to-many' | 'publishing' | 'data-literacy' | 'practice'
  | 'less-compute';
type ReserveId = 'stethoscope' | 'many-hats';   // drawn, not in use

type ImageSize = {
  hero: 160 | 240 | 280 | 320;   // phone, tablet, desktop, wide
  aside: 320; tile: 280; peek: 96 | 128 | 160;
  plateMin: 240;                 // keeps the screen >= 2.5 px
};

type Icon = { grid: 24; stroke: 1.6; caps: 'round'; fill: 'none' };

type Texture = { typodojo: 'prints'; pulp: 'plates' | 'prints'; thinkwell: 'none' };

// ---------------------------------------------------------------- motion
type Duration = 120 | 240 | 480 | 1600;  // quick, settle, breath, loader
type Easing = 'arrive' | 'leave';
// arrive: cubic-bezier(0.2, 0.8, 0.2, 1)
// leave:  cubic-bezier(0.4, 0, 1, 1)

type Motion = {
  duration: Duration;
  easing: Easing;
  endsOnStill: true;
  loops: boolean;                // loaders only
  reduced: 'end-frame' | 'fade-120';
};

type Input = 'touch' | 'mouse' | 'trackpad' | 'keyboard' | 'pen';
type Pointer = { fine: boolean; canHover: boolean };

type Reveal = {
  preview: ['hover', 'focus', 'tap'];   // all three, always
  select: ['click', 'Enter', 'second-tap'];
  clear: 'Escape';
};

// ---------------------------------------------------------------- texture
type Gradient = {
  id: 'hero' | 'scrim' | 'feature';   // the only gradients
  glowPct?: [8, 28];             // hero: --c-glow over the ground
  scrimPct?: [60, 90];           // scrim: under a caption
  featureSolidPct?: [30, 45];    // feature: solid, then thinning
  textOn: 'solid-end';           // text never sits on the thin end
};

type Photo = {
  key: 'talk' | 'crowd' | 'light' | 'hero' | 'break';
  license: 'Unsplash License';   // in assets/source/photos.json
  credit: { caption: boolean; footer: true };   // hero: footer only
  place: 'hero' | 'band' | 'break' | 'feature'; // full bleed
  perPage: { hero: 1; bandsAndBreaks: 3; feature: 1 };
  breakHeight: 0.75;             // of a band
  files: { widths: [640, 1280, 1920]; maxKB: [45, 110, 190] };
  load: { lazy: true; placeholderPx: 24; sized: true };
  filter: 'var(--c-photo-filter)';   // gray in mono
  parallax: { screenPct: 24; px: [40, 240]; reduced: 'still' };
  caption?: { size: '--t-heading'; lines: 1 | 2 };
};

type Dither = {
  screen: 'am-halftone';  dot: 'round';  grid: 'square';  angleDeg: 0;
  pitchPx: { native: 13; atWidth: 760; onScreen: [2.5, 8] };
  dotOfPitch: [0.15, 0.65];      // never touching
  coveragePct: [10, 45];
  dust?: { maxDotOfPitch: 0.25; maxAreaPct: 1 };
  ink: 'var(--c-plate)';         // Halftone, Bubble, Smudge by mode
  file: { kind: 'webp-mask' | 'jpeg'; quality?: 85; scale: 2; maxKB: 120 };
  focus: { point: 1; rest: 0.55; duration: 'settle' };
};

type Glass = {
  veil: number;                  // ground at 0.55 to 0.85
  blurPx: number;                // 12 to 20
  saturate: number;              // 1 to 1.3
  fade: { startPct: number; endPct: number };   // 55-70, 90-100
  edge: 'none'; border: 'none'; shadow: 'none'; tint: 'none';
  halo: [2, 8, 16];              // text-shadow in the ground color
  fallback: { noBackdrop: 0.92; reducedTransparency: 'solid';
              forcedColors: 'Canvas' };
};
// typodojo { veil .62, blur 16, saturate 1.2 }  pulp { veil .72, blur 14, saturate 1 }
// thinkwell: no panes; modal scrims blur 8 to 12

type PrintId = 'wordmark-run' | 'said-meant' | 'understand' | 'questions'
  | 'think-again' | 'halftone-swell' | 'conversation' | 'gum-bubbles'
  | 'clouds' | 'press-marks' | 'graph' | 'targets' | 'checker' | 'zigzag' | 'heads' | 'universe';
type Print = {
  id: PrintId; kind: 'text' | 'geometric' | 'brand';
  tile: { width: 1600; shownPx: [800, 1600] };
  ink: 'var(--c-print)';         // 1.08 to 1.25:1 on what it sits on
  perBand: 1; touching: false;   // printed bands never touch
  moves: false;                  // typodojo's prints may move
  strip?: { heightPx: 96 | 120; text: false };
  textOver: 'glass' | 'card';
};

// ---------------------------------------------------------------- css
// tokens.css is generated from tokens.json. Everything else reads it.
// @layer reset, tokens, base, layout, components, utilities;
// <html data-mode="light | dark | mono">, the Mode type above

type ColorRole = `--c-${'ground' | 'type' | 'muted' | 'line' | 'band'
  | 'card' | 'btn-bg' | 'btn-fg' | 'link' | 'plate' | 'print' | 'scrim'
  | 'glow' | 'feature' | 'feature-type' | 'feature-muted' | 'feature-ink'
  | 'feature-print' | 'photo-ground' | 'photo-type' | 'photo-filter'
  | 'thread' | 'dye' | 'api' | 'api-far' | 'scheme'}`;            // the only vars a mode sets

type Palette = `--pulp-${string}`;          // fixed in every mode
type SpaceVar = `--s-${Space}`;
type RadiusVar = '--r-0' | '--r-6' | '--r-pill';
type MotionVar = '--dur-quick' | '--dur-settle' | '--dur-breath'
  | '--dur-loader' | '--ease-arrive' | '--ease-leave';
type Other = '--z-rail' | '--z-bar' | '--z-modal' | '--f-display'
  | '--f-reading' | '--col' | '--frame' | '--gutter' | '--tap';

type Selector = `.p-${string}` | `.u-${string}`   // Pulp, utilities
  | `[data-state="${string}"]` | `[aria-${string}]`;
type Breakpoint = 560 | 768 | 1024 | 1280;  // min-width only
type HoverOnly = '@media (hover: hover) and (pointer: fine)';
type Banned = '!important' | '.is-*' | 'outline: none' | 'transition: none';

// ---------------------------------------------------------------- interaction
// Input and Pointer: see motion above
type State = 'rest' | 'hover' | 'focus-visible' | 'active' | 'disabled'
  | 'busy' | 'checked' | 'current' | 'expanded' | 'previewed'
  | 'pinned' | 'open' | 'closed' | 'sending' | 'done' | 'error'
  | 'invalid' | 'valid' | 'hidden' | 'empty' | 'pressed';

type Interaction = {
  id: string;                      // interactions.json
  element: string;                 // native first
  purpose: string;
  states: State[];
  keys: string;                    // the keyboard path
  touch: string;                   // the touch path, never hover-only
  aria: string;
  motion: MotionId[];              // motion.json ids
};

type Dialog = Interaction & {
  trapsFocus: true; closesOn: ['Escape', 'outside', 'close'];
  returnsFocusTo: 'opener'; desktop: 'modal'; phone: 'sheet';
};

// ---------------------------------------------------------------- animation
type MotionId = 'highlight-sweep' | 'section-reveal' | 'plate-focus'
  | 'robot-peek' | 'robot-blink' | 'dialog-open' | 'dialog-close'
  | 'mode-change' | 'press' | 'link-underline' | 'form-status'
  | 'photo-drift';

type Animatable = 'opacity' | 'transform' | 'color' | 'background-color'
  | 'border-color' | 'box-shadow' | 'background-size'
  | 'text-decoration-thickness' | 'outline-color';

type MotionSpec = {
  id: MotionId;                    // also the @keyframes name
  trigger: string;
  what: string;                    // Animatable properties only
  duration: 'quick' | 'settle' | 'breath' | 'loader' | 'scroll';
  easing: 'arrive' | 'leave' | 'scroll';   // scroll: tied to scroll, not time
  loop: 'never' | string;          // loaders and the capped blink only
  reduced: string;                 // never 'transition: none'
  endsOnStill: true;
  trigger_api?: 'IntersectionObserver';  // scroll: once, never a listener
};

// ---------------------------------------------------------------- data
type Provenance = {
  n?: number; of?: number;
  asOf: string;                  // ISO 8601, shown in local time
  interval?: { start: string; end: string };
  source: string;
  verified?: string;             // how people were verified
  attribute: 'verified' | 'stated' | 'learned';
  sample: boolean;               // shows Sample data
  simulated: boolean;            // always dashed
};

type ChartSlot = 1 | 2 | 3 | 4;  // 5+: neutral, direct labels

type Chart = {
  kind: 'bar' | 'line' | 'dumbbell' | 'scatter' | 'area'
      | 'table' | 'map' | 'pictogram';
  provenance: Provenance;
  caption: string;               // unit, n or source, and estimate type
  valuesAsText: true;
  zeroBaseline: true;
};

// ---------------------------------------------------------------- voice
type Voice = 'warm' | 'essay' | 'exact';  // -1, 0, +1

type Copy = {
  property: PropertyId;
  voice: Voice;
  text: string;
  shape: ['hook', 'benefit', 'example'];
};

// Checked by brand_lint.py on every build
type CopyCheck =
  | 'no-em-or-en-dash' | 'american-spelling'
  | 'no-banned-phrase' | 'thinkwell-lowercase-w'
  | 'genderless' | 'numbers-have-units'
  | 'sample-data-labeled' | 'no-tm-in-running-text';

const BANNED = ['empower', 'Signal, not noise', 'trust scores', 'fidget mode', 'streetwear'];

// ---------------------------------------------------------------- site
// pulp.com.ai, every page. Records in pack/site.json and pack/sitemap.json.
type Route = `/${string}` | '(modal)' | '(command menu)' | '(sheet)';

type TemplateId = 'essay' | 'hub' | 'list' | 'longread' | 'product'
  | 'sdk' | 'work' | 'people' | 'policy' | 'brand' | 'contact' | 'not-found';

type SectionKind = 'hero' | 'page-head' | 'lede' | 'band' | 'plates'
  | 'ledger' | 'cards' | 'list' | 'filter' | 'prose' | 'toc' | 'figure'
  | 'chart' | 'code' | 'modules' | 'people' | 'photo' | 'photo-break'
  | 'scale' | 'research' | 'form' | 'related' | 'cta' | 'robot'
  | 'not-found';

type Template = { id: TemplateId; use: string; sections: SectionKind[] };

type Shell = {
  bar: { mark: 'pulp-wordmark'; nav: 6; sticky: true;
         right: ['mode-switch', 'search-trigger', 'contact-trigger'];
         phone: ['contact-trigger', 'menu-button'] };
  footer: { groups: 7; closing: ['pulp-wordmark', 'EST. 2026', 'Brooklyn, New York'];
            credits: 'every photo on the page' };
  always: ['skip-link', 'contact-modal', 'search', 'sheet'];
  storage: 'saved mode only';    // no cookies, no third-party scripts
  noJs: 'reads and navigates';   // dialogs fall back to pages
  firstViewKBgz: 200;            // per page, photos excluded
};

type SlotKind = 'copy' | 'photo' | 'data' | 'mark' | 'endpoint';
type Slot = { id: string; kind: SlotKind; pages: string; spec: string };
// A slot is filled by Shah. Until then its section is left out,
// never filled with placeholder text.

type PageRecord = {
  path: Route; title: string; template: TemplateId;
  action: string;                // the one primary action
  meta: { title: `${string} | Pulp` | 'Pulp'; description: string };
  status: 'built' | 'spec';
  slots: Slot['id'][];
  details: 'page' | 'modal';     // modal: inline <details>, upgraded
};

// ---------------------------------------------------------------- pack
// pulp-brand-kit/v6a
//   tokens.json      every value, by property and mode
//   rules.json       every rule: id, scope, check, text
//   contracts.ts     these types
//   brand_lint.py    the lint checks, by rule id
//   README.md        what, how, and the summary

type RuleRecord = {
  id: string;                    // R-<AREA>-<NN>, never reused
  scope: 'house' | PropertyId;
  check: 'lint' | 'layout' | 'review';
  text: string;
  was?: string;                  // the v5a or C-rule id it replaces
};

type LintResult = {
  file: string; rule: string;
  line: number; found: string;
};

export {};  // a module: these names never collide with the DOM's
