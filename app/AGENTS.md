# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Mobile app conventions

- **Path alias**: `@/*` → `src/*` (and `@/assets/*` → `assets/*`). Import with `@/...`, never long relative paths.
- **UI library**: reusable design-system primitives live in `src/components/ui/` and are re-exported from its barrel `src/components/ui/index.ts` (`Button`, `Card`, `Input`, `FormField`, `SegmentedControl`, `SpeciesPicker`, `Toast`, `EmptyState`, `ErrorState`, `Skeleton`, etc.). Build screens from these — don't hand-roll styled `View`/`Text` when a primitive exists, and add new shared primitives here (barrel-exported) rather than inline in a screen.
- **Design tokens**: `src/constants/theme.ts` (`Colors.light` / `Colors.dark`) **must stay in sync with the CSS variables in `src/global.css`** — NativeWind reads the CSS vars, but some RN props (e.g. `placeholderTextColor`) require a resolved color from `theme.ts`. Change both together.
- **Forms**: react-hook-form + zod. Validation schemas are centralized in `src/lib/forms/schemas.ts` (each exports an inferred `…Values` type); reuse/extend them rather than validating inline.
- **API & domain logic**: HTTP client and feature helpers live in `src/lib/` (`api.ts`, `auth-context.tsx`, `token-storage.ts`, `animals.ts`, `health-events.ts`, `notifications.ts`, `export.ts`). `features.ts` holds feature flags (e.g. `AI_EXTRACTION_ENABLED`).
- **Platform variants**: `*.web.tsx` / `*.ios.tsx` files override the base component per platform (Metro resolves them) — keep the shared base and the platform file consistent.

## Testing

- Run `npm test` (jest, `jest-expo` preset) or `npm run test:watch`. Tests live in `__tests__/` folders next to the code (`src/lib/__tests__`, `src/lib/forms/__tests__`, `src/components/ui/__tests__`).
- Jest bypasses Metro, so `.css` imports are mapped to `src/test/mocks/style-mock.js` via `moduleNameMapper` in `jest.config.js`. If a new module imports CSS and fails to parse under Jest, that mapping (or `transformIgnorePatterns`) is where to look.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
