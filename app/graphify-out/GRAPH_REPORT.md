# Graph Report - .  (2026-08-02)

## Corpus Check
- 253 files · ~156,766 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 543 nodes · 972 edges · 73 communities (31 shown, 42 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.56)
- Token cost: 30,000 input · 2,411 output

## Community Hubs (Navigation)
- Animal & Health Event Screens
- App Layout & Tab Navigation
- Skill Telemetry Hook
- Lint & Test Config
- App Config (app.json)
- Root Layout & Auth Screens
- Badge / EmptyState / ErrorState UI
- Card / Chip / SegmentedControl UI
- SwiftUI Component Lister
- TypeScript Env & tsconfig
- HTTP Fetch Cache & Validation
- Scripts Package Deps
- HTML Viewer Generator
- Date Field & Date Utils
- Field Shell & Species Picker
- Form Field & Input
- Expo Glass / Linking Deps
- reset-project Script
- Toast Notifications
- Project Docs & Expo Scaffold
- Animated Icon (Web)
- Avatar Component
- Button Component
- Android Snapshot Script
- Metro / NativeWind Config
- FAB Component
- ListRow Component
- Typography & Tailwind Tokens
- Static Check Gate
- iOS Snapshot Script
- Web Snapshot Script
- ESLint Config
- Color Scheme Hook
- clean-fixture Script
- latest-sdk Script
- make-fixture Script
- make-workspace Script
- expo-constants
- expo-device
- expo-file-system
- expo-font
- expo-image
- expo-image-picker
- expo-notifications
- expo-router
- expo-secure-store
- expo-sharing
- expo-splash-screen
- expo-status-bar
- expo-symbols
- expo-system-ui
- @expo/ui
- @expo/vector-icons
- expo-web-browser
- @hookform/resolvers
- nativewind
- react
- react-dom
- react-hook-form
- react-native
- react-native-gesture-handler
- react-native-reanimated
- react-native-screens
- react-native-web
- react-native-worklets
- tailwindcss
- zod

## God Nodes (most connected - your core abstractions)
1. `expo-router` - 16 edges
2. `Button()` - 16 edges
3. `Colors` - 15 edges
4. `useToast()` - 14 edges
5. `expo` - 13 edges
6. `api` - 13 edges
7. `main()` - 11 edges
8. `Icon()` - 11 edges
9. `getToken()` - 11 edges
10. `scripts` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Expo Versioned Docs Directive` --rationale_for--> `Expo Framework`  [INFERRED]
  AGENTS.md → README.md
- `Probe()` --calls--> `useToast()`  [EXTRACTED]
  src/components/ui/__tests__/toast.test.tsx → src/components/ui/toast.tsx
- `app CLAUDE.md (includes AGENTS.md)` --references--> `Expo Versioned Docs Directive`  [EXTRACTED]
  CLAUDE.md → AGENTS.md
- `fetchSchema()` --calls--> `fetchCached()`  [EXTRACTED]
  .agents/skills/eas-workflows/scripts/validate.js → .agents/skills/eas-workflows/scripts/fetch.js
- `EditHealthEventScreen()` --calls--> `useToast()`  [EXTRACTED]
  src/app/(app)/animals/[id]/events/[eventId].tsx → src/components/ui/toast.tsx

## Import Cycles
- None detected.

## Communities (73 total, 42 thin omitted)

### Community 0 - "Animal & Health Event Screens"
Cohesion: 0.07
Nodes (54): expo-router, EditHealthEventScreen(), NewHealthEventScreen(), AnimalDetailScreen(), NewAnimalScreen(), HomeScreen(), ONBOARDING_STEPS, LEAD_DAY_OPTIONS (+46 more)

### Community 1 - "App Layout & Tab Navigation"
Cohesion: 0.09
Nodes (20): AppTabs(), styles, ExternalLink(), Props, HintRowProps, styles, styles, ThemedText() (+12 more)

### Community 2 - "Skill Telemetry Hook"
Cohesion: 0.10
Nodes (34): eventPayload(), fs, main(), parseArgs(), path, pluginRootFor(), {
  POSTHOG_PROJECT_API_KEY,
  SOURCE,
  telemetryActive,
  telemetryConfigured,
  detectHarness,
  platformProps,
  telemetryIdentity,
  sendToPosthog,
}, readHookInput() (+26 more)

### Community 3 - "Lint & Test Config"
Cohesion: 0.06
Nodes (30): eslint, eslint-config-expo, jest, jest-expo, devDependencies, eslint, eslint-config-expo, jest (+22 more)

### Community 4 - "App Config (app.json)"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+18 more)

### Community 5 - "Root Layout & Auth Screens"
Cohesion: 0.12
Nodes (17): RootNavigator(), SignInScreen(), SignUpScreen(), AnimatedSplashOverlay(), glowKeyframe, keyframe, logoKeyframe, styles (+9 more)

### Community 6 - "Badge / EmptyState / ErrorState UI"
Cohesion: 0.16
Nodes (14): Badge(), BadgeProps, BadgeTone, CONTAINER, GLYPH, LABEL, EmptyStateProps, ErrorStateProps (+6 more)

### Community 7 - "Card / Chip / SegmentedControl UI"
Cohesion: 0.17
Nodes (10): Card(), CardProps, Chip(), ChipProps, SegmentedControl(), SegmentedControlProps, SegmentedOption, SHAPE (+2 more)

### Community 8 - "SwiftUI Component Lister"
Cohesion: 0.13
Nodes (10): buildRoot, composeComponents, composeModifiers, fs, path, pkgRoot, swiftuiComponents, swiftuiModifiers (+2 more)

### Community 9 - "TypeScript Env & tsconfig"
Cohesion: 0.13
Nodes (14): ./assets/*, expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, jest-env.d.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx (+6 more)

### Community 10 - "HTTP Fetch Cache & Validation"
Cohesion: 0.26
Nodes (10): CACHE_DIRECTORY, fetchCached(), getExpires(), hashUrl(), loadCacheEntry(), parseMaxAge(), saveCacheEntry(), fetchSchema() (+2 more)

### Community 11 - "Scripts Package Deps"
Cohesion: 0.17
Nodes (11): dependencies, ajv, ajv-formats, js-yaml, name, private, type, version (+3 more)

### Community 12 - "HTML Viewer Generator"
Cohesion: 0.44
Nodes (10): b64_img(), build_page(), load_json(), main(), render_config_card(), render_expectations(), render_iteration(), render_quality() (+2 more)

### Community 13 - "Date Field & Date Utils"
Cohesion: 0.49
Nodes (6): DateField(), DateFieldProps, formatLongDate(), isFutureDate(), parseIsoDate(), toIsoDate()

### Community 14 - "Field Shell & Species Picker"
Cohesion: 0.33
Nodes (5): FieldShell(), FieldShellProps, SpeciesPicker(), SpeciesPickerProps, Species

### Community 15 - "Form Field & Input"
Cohesion: 0.29
Nodes (5): FormField(), FormFieldProps, Input, InputProps, schema

### Community 16 - "Expo Glass / Linking Deps"
Cohesion: 0.22
Nodes (9): expo, expo-glass-effect, expo-linking, dependencies, expo, expo-glass-effect, expo-linking, react-native-safe-area-context (+1 more)

### Community 17 - "reset-project Script"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 18 - "Toast Notifications"
Cohesion: 0.29
Nodes (6): Probe(), ToastApi, ToastContext, ToastProvider(), ToastState, ToastType

### Community 19 - "Project Docs & Expo Scaffold"
Cohesion: 0.33
Nodes (7): Expo Versioned Docs Directive, app CLAUDE.md (includes AGENTS.md), create-expo-app Scaffold, Expo Framework, File-based Routing (Expo Router), my-pets Expo App, reset-project Command

### Community 20 - "Animated Icon (Web)"
Cohesion: 0.29
Nodes (4): glowKeyframe, keyframe, logoKeyframe, styles

### Community 21 - "Avatar Component"
Cohesion: 0.33
Nodes (5): Avatar(), AvatarProps, AvatarSize, BOX, GLYPH

### Community 22 - "Button Component"
Cohesion: 0.29
Nodes (5): ButtonProps, ButtonVariant, CONTAINER, ICON_COLOR_KEY, LABEL

### Community 23 - "Android Snapshot Script"
Cohesion: 0.47
Nodes (3): emulator_alive(), log_step(), snapshot-android.sh script

### Community 24 - "Metro / NativeWind Config"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

## Knowledge Gaps
- **177 isolated node(s):** `CACHE_DIRECTORY`, `name`, `version`, `private`, `type` (+172 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **42 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `Animal & Health Event Screens` to `App Layout & Tab Navigation`, `App Config (app.json)`, `Root Layout & Auth Screens`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `plugins` connect `App Config (app.json)` to `Animal & Health Event Screens`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `CACHE_DIRECTORY`, `name`, `version` to the rest of the system?**
  _177 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Animal & Health Event Screens` be split into smaller, more focused modules?**
  _Cohesion score 0.06684733514001806 - nodes in this community are weakly interconnected._
- **Should `App Layout & Tab Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.09487179487179487 - nodes in this community are weakly interconnected._
- **Should `Skill Telemetry Hook` be split into smaller, more focused modules?**
  _Cohesion score 0.1036036036036036 - nodes in this community are weakly interconnected._
- **Should `Lint & Test Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._