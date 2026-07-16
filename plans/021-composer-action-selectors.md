# 021 — MessageActionStore action selectors + centralized draft codec

- **Status:** TODO
- **Priority:** P2
- **Effort:** S–M
- **Risk:** Low-medium (composer state reads + draft persistence; guarded by existing composer suites + new codec test)
- **Planned at:** `HEAD` (branch `native-34-roomview-hooks`)

## Context (read first — you have no other context)

Repo: Rocket.Chat React Native app. TypeScript strict, pnpm, Jest (`TZ=UTC pnpm test`). Prettier: tabs, single quotes, 130 width, no trailing commas. `'use memo'` (React Compiler) over manual memoization.

`MessageActionStore` (`app/containers/message/stores/MessageActionStore.tsx`) is a Zustand store whose single `action` field is a discriminated union `TMessageActionState` — `null | { kind: 'edit', messageId } | { kind: 'quote', messageIds } | { kind: 'react', messageId }`. Consumers today reach into `action.kind` directly, so the union's shape is **smeared across four modules** (arch-composer P1). The store already ships one narrow selector following the wanted pattern:

```ts
// MessageActionStore.tsx — existing exemplar to copy
export const useMessageAction = (): TMessageActionState => useMessageActionStore(s => s.action);
export const useIsBeingEdited = (messageId: string): boolean =>
	useStore(store, s => s.action?.kind === 'edit' && s.action.messageId === messageId);
```

### Smear sites (read each before editing)

- `app/containers/MessageComposer/MessageComposer.tsx:125` `action?.kind === 'edit'` → **then reads `action.messageId`** (payload needed).
- `MessageComposer.tsx:139` `action?.kind === 'quote'` → reads `action.messageIds` (ids needed).
- `MessageComposer.tsx:163` `action?.kind === 'quote'` → reads `action.messageIds` (ids needed).
- `app/containers/MessageComposer/hooks/useAutoSaveDraft.ts:25` `action?.kind === 'edit'` (boolean guard).
- `useAutoSaveDraft.ts:28` `action?.kind === 'quote'` → `action.messageIds` (ids).
- `useAutoSaveDraft.ts:30` `action?.kind === 'react'` → `action.messageId` (payload).
- `app/containers/MessageComposer/hooks/useChooseMedia.ts:100` `action?.kind === 'quote'` → `action.messageIds` (ids).
- `app/containers/MessageComposer/components/ComposerInput.tsx:108` `action?.kind !== 'edit'` (boolean guard).
- `ComposerInput.tsx:127` `prevAction?.kind === 'edit' && action?.kind !== 'edit'` (needs previous value — keep).
- `ComposerInput.tsx:131` `action?.kind === 'edit'` → `action.messageId` (payload).
- `ComposerInput.tsx:136` `action?.kind === 'quote' && action.messageIds.length` (ids).

**Reality check:** selectors fully replace only the boolean-guard and ids-only sites. Sites that read a payload (`action.messageId` for edit/react) still need the discriminated value — do NOT force a selector there just to re-read the payload separately (two subscriptions where one suffices). The goal is to shrink the smear, not eliminate every `.kind`.

### Draft codec split (arch-composer P2)

The composer draft is JSON with a `{ quotes, msg }` shape. It is **encoded** in one place and **decoded** in another with no shared contract:

```ts
// useAutoSaveDraft.ts:26-33 — ENCODE
if (action?.kind === 'quote') draftMessage = JSON.stringify({ quotes: action.messageIds, msg: text });
else if (action?.kind === 'react') draftMessage = JSON.stringify({ quotes: [action.messageId], msg: text });
else draftMessage = m ?? text;
```

```ts
// ComposerInput.tsx:98-104 — DECODE
const parsedDraft = parseJson(draftMessage); // parseJson returns the raw string on non-JSON
if (parsedDraft?.msg || parsedDraft?.quotes) setQuotesAndText?.(parsedDraft.msg, parsedDraft.quotes);
else setInput(draftMessage);
```

`parseJson` (`app/lib/methods/helpers/parseJson.ts`) returns the original string when input isn't JSON — the decode branch relies on that. Encode/decode live in `app/lib/methods/draftMessage.ts` neighbors (`saveDraftMessage`/`loadDraftMessage`), the natural home for a codec.

## Change

### Step 1 — action selectors on MessageActionStore

Add two selectors next to `useMessageAction`/`useIsBeingEdited`, matching the throw-based `useMessageActionStore` wrapper (they run inside a `MessageActionProvider` — composer is always provider-wrapped, unlike message rows):

```ts
export const useIsEditing = (): boolean => useMessageActionStore(s => s.action?.kind === 'edit');

const EMPTY_QUOTES: string[] = [];
export const useQuotedMessageIds = (): string[] =>
	useMessageActionStore(s => (s.action?.kind === 'quote' ? s.action.messageIds : EMPTY_QUOTES));
```

`EMPTY_QUOTES` is a module-level constant so the no-quote path returns a stable reference (no new array per render → no needless re-render). `messageIds` from the store is already a fresh array only on real change.

Apply at the boolean/ids-only sites:

- `ComposerInput.tsx:108` `action?.kind !== 'edit'` → `!isEditing` (via `const isEditing = useIsEditing()`).
- `ComposerInput.tsx:136` `action?.kind === 'quote' && action.messageIds.length` → `quotedMessageIds.length` (via `const quotedMessageIds = useQuotedMessageIds()`), and `focus()` when non-empty.
- `useAutoSaveDraft.ts:25` boolean edit guard → `isEditing` (but see codec step — this whole block moves).
- `useChooseMedia.ts:100` `action?.kind === 'quote' ? action.messageIds : []` → `quotedMessageIds`.
- `MessageComposer.tsx:139` / `:163` quote branches → read `quotedMessageIds`; branch on `quotedMessageIds.length`.

Keep the discriminated read (`useMessageAction()` + `action.messageId`) at the payload sites: `MessageComposer.tsx:125` (edit → `action.messageId`), `ComposerInput.tsx:127/131` (prevAction diff + edit `messageId`), `useAutoSaveDraft.ts:30` (react → `action.messageId`). For `:127`'s `prevAction` (a `useRef`/previous-value pattern), the selector doesn't apply — leave it.

Note: `useIsBeingEdited(messageId)` (per-message, degrades via inertStore) stays as-is — it serves message rows, a different concern from these composer-level guards.

### Step 2 — centralized draft codec in `draftMessage.ts`

Add a codec pair beside `saveDraftMessage`/`loadDraftMessage`:

```ts
// draftMessage.ts
import { parseJson } from './helpers/parseJson';
import { type TMessageActionState } from '../../definitions';

export const encodeDraftMessage = ({
	action,
	text,
	fallback
}: {
	action: TMessageActionState;
	text: string;
	fallback?: string; // the `m ?? text` explicit-arg override from useAutoSaveDraft
}): string => {
	if (action?.kind === 'quote') return JSON.stringify({ quotes: action.messageIds, msg: text });
	if (action?.kind === 'react') return JSON.stringify({ quotes: [action.messageId], msg: text });
	return fallback ?? text;
};

export const decodeDraftMessage = (raw: string): { msg: string; quotes: string[] } | null => {
	const parsed = parseJson(raw);
	if (parsed && typeof parsed === 'object' && (parsed.msg || parsed.quotes)) {
		return { msg: parsed.msg, quotes: parsed.quotes ?? [] };
	}
	return null; // caller falls back to setInput(raw)
};
```

Then:

- `useAutoSaveDraft.ts:26-33`: replace the inline `if/else` with `draftMessage = encodeDraftMessage({ action, text, fallback: m })`. The `saveMessageDraft` still owns the `route.name === 'ShareView'` and edit-skip short-circuits and the `oldText` dedupe — only the encode expression moves. (The edit-skip at :25 can read the raw `action?.kind === 'edit'` guard or `useIsEditing`; keep whichever the executor finds reads cleaner given `action` is still in scope for the react branch's payload — codec now owns that payload read, so `useIsEditing` is fine and the hook can stop reading `action` for encoding. Confirm `action` is still needed elsewhere in the hook before dropping it.)
- `ComposerInput.tsx:98-104`: replace with `const decoded = decodeDraftMessage(draftMessage); if (decoded) setQuotesAndText?.(decoded.msg, decoded.quotes); else setInput(draftMessage);`.

The wire format (`{ quotes, msg }` JSON) is unchanged — this is a pure extraction so existing persisted drafts keep loading.

## Scope

- **In scope:** `MessageActionStore.tsx` (2 selectors), `draftMessage.ts` (2 codec fns + colocated/near test), `MessageComposer.tsx`, `useAutoSaveDraft.ts`, `useChooseMedia.ts`, `ComposerInput.tsx`; a `draftMessage` codec test.
- **Out of scope — do not touch:** `TMessageActionState` union shape, `parseJson`, `saveDraftMessage`/`loadDraftMessage` DB logic, ComposerStore/RoomStore, any `.kind` read that needs a payload the selectors don't expose, the payload sites listed as "keep".

## Verification / done criteria

1. `pnpm lint` → exits 0 (eslint warning baseline does not rise above 171; if it does, STOP and report).
2. `TZ=UTC pnpm test --testPathPattern='MessageActionStore|draftMessage|MessageComposer|ComposerInput|useAutoSaveDraft|useChooseMedia'` → passes.
3. `TZ=UTC pnpm test` → full suite green, no snapshot churn.
4. `grep -rn "action?.kind === 'quote'" app/containers/MessageComposer` → only the payload/keep sites remain (no ids-only site left inline).
5. React-Compiler contract test still green (new selectors/codec are plain functions; no `'use memo'` file should newly skip).

## Test plan

- **`MessageActionStore.test.tsx`** (extend if present, else colocate a new suite following the store's DI pattern — `createMessageActionStore` + `MessageActionProvider` wrapper): `useIsEditing()` true only for `{kind:'edit'}`; `useQuotedMessageIds()` returns the ids for `{kind:'quote'}` and the **same** `EMPTY_QUOTES` reference across renders for null/edit/react (reference-stability guard).
- **`draftMessage` codec test** (colocate `draftMessage.test.ts` or extend an existing draft suite): `encodeDraftMessage` round-trips quote (`{quotes,msg}`), react (`{quotes:[id],msg}`), and plain (`fallback ?? text`); `decodeDraftMessage` parses a JSON draft to `{msg,quotes}`, returns `null` for a plain-string draft (so the caller's `setInput(raw)` fallback fires), and tolerates `parseJson` returning the raw string. Assert encode→decode round-trip for the quote case.
- Existing composer suites must still pass unchanged (behavior-preserving extraction).

## Escape hatches

- If a "keep" payload site turns out to be reachable only via a selector without re-subscribing to the full `action`, note it but do NOT add a third selector this pass unless it removes a real double-subscription — scope creep.
- If any persisted-draft test encodes/decodes a shape not covered by `{quotes,msg}` (e.g. a legacy format), STOP and report before changing the codec — the wire format must stay backward-compatible.
- If `TMessageActionState` isn't importable into `draftMessage.ts` without a cycle (`lib/methods` ↔ `definitions`), STOP and report; do not weaken the type to `any`.
