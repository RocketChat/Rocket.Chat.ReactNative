# PR native-34-roomview-hooks — architecture improvement compilation

Wave 1 (spawned 12:00 BRT, opus x5):

- arch-roomview: app/views/RoomView/\*\*
- arch-message: app/containers/message + markdown
- arch-composer: app/containers/MessageComposer
- arch-stores: app/lib (hooks/stores/methods/services)
- arch-views: other views/containers (ShareView, ThreadMessagesView, Avatar, ReactionsList, UIKit…)

## Findings

### arch-views (other views/containers) — DONE

- **P1** MessagesView ↔ SearchMessagesView duplicated scaffolding: identical `showAttachment`, near-identical `navToRoomInfo`/`jumpToMessage`, same `mapStateToProps` `{user}`, same `<A11yGateProvider><MessageRoomProvider>…<FlatList/>` shell (`MessagesView/index.tsx:131,285,136`; `SearchMessagesView/index.tsx:197,192,205`). Extract shared `MessageListScreen` wrapper/hook.
- **P2** `toggleFollowThread` service sited under `app/views/RoomView/services/` but imported by ThreadMessagesView (`ThreadMessagesView/index.tsx:466`) — move to shared home (`app/lib/methods` or message-scoped services).
- **P2** RoomInfoView: `roomFromRid ? setRoomFromRid : setRoom` branch repeated 3×; uid-derivation (`getUidDirectMessage`) repeated in `resolveRoomUserId` + `loadUser` (`RoomInfoView/index.tsx:175,276-312`). Extract `updateActiveRoom(patch)` + single deriver.
- **P3** `'use memo'` adoption inconsistent (ForwardMessageView:24, RoomInfoView:43 only) — deliberate sweep or documented rule.
- **P3** ModalBlockView `{} as unknown as TAnyMessageModel` fed to MessageProvider (`ModalBlockView.tsx:99`) — seam smell, watch if context grows required fields.
- **P3** SearchMessagesView twin `jumpToMessage`/`jumpToMessageByUrl` — rename for intent.
- Positive: ReactionsList/Avatar self-sourcing + sort-mutation fix; ThreadDetails typed prop. Backlog: convert MessagesView/SearchMessagesView classes → shared hook-based screen.

### arch-message (message + markdown) — DONE

- **P2** MessageRoomStore dual-source handler resolution (`s.navToRoomInfo ?? s.handlers?.…`, `MessageRoomStore.tsx:153-156`) — normalize once at provider mount; selectors read single field.
- **P2** All-optional `MessageRoomState` shape (`MessageRoomStore.tsx:10-36`, flagged in ARCHITECTURE.md:104) — non-optional post-mount shape would kill defensive `?.` across leaves.
- **P2** Auto-translate gating duplicated in `useTranslateLanguage` + `useMessageText` (`MessageStore.tsx:296-322`) — extract shared `resolveTranslation` pure helper.
- **P3** `useMessageUser`/`useBaseUrl` are pure redux selectors colocated in store module (`MessageRoomStore.tsx:183-184`) — move to redux-hooks file.
- **P3** ~80 lines `__DEV__` guard code interleaved in store files — extract `stores/devGuards.ts`.
- **P3** Markdown dep-sourcing asymmetric: `getCustomEmoji` global hook vs `useRealName`/`navToRoomInfo`/etc. still via MarkdownContext props (`markdown/index.tsx:107-132`).
- **P3** Large leaves: `Reply.tsx` (239 lines, mixes download state + layout + markdown), `CollapsibleQuote.tsx` (167).
- Verified good: provider zustand-sync effects legit; granular useShallow selectors; index.tsx 39 lines.

### arch-stores (app/lib shared infra) — DONE

- **P1** `goRoom.ts:58-80` lazy `require` of `views/RoomView/stores/RoomStore` → inverted methods→views dependency, hidden from static graph; warm-up correctness coupled to RoomStore grace-sweep timing. Move warm-up to a view-owned seam; keep goRoom store-agnostic.
  > VALID (dependency-inversion angle). But warm-up correctness sub-angles already rejected: BUG-01 (refcount starvation — every acquire pairs a release, balanced) and PERF-02 (warm-up must stay in navigate() for deepLinking saga). Scope the fix to the require inversion, not warm-up timing.
- **P2** `isReadOnly` / `isReadOnlySync` parallel branch skeletons (`isReadOnly.ts:17-59`) — factor decision tree once, inject permission resolver.
- **P2** `createUploadRecord` (`sendFileMessage/utils.ts:59-113`) fires `Alert.alert` in data layer + `[null,null]` sentinel tuple — return discriminated result, caller owns Alert.
- **P2** `subscriptions/room.ts:73,82` defensive `sub?.unsubscribe?.()` papers over unclear subscribeRoom() return contract — type the SDK return.
- **P3** listener fields `Promise<any>` in `subscriptions/room.ts` — type onStreamData returns.
- Positive: updateMessage writer-lock fix; decryptQuoteAttachment mutation-hazard removal; useLiveRef/useCustomEmoji correctly thin.

### arch-composer (MessageComposer) — DONE

- **P1** `action.kind` union knowledge smeared across 4 modules (MessageComposer.tsx:125-164, useAutoSaveDraft.ts:26-35, useChooseMedia.ts:100, ComposerInput.tsx:108-139) — add `useQuotedMessageIds()`/`useIsEditing()` selectors on MessageActionStore.
- **P2** ComposerProvider props→store mirror effect with 12-dep array (ComposerStore.tsx:34-63) — 3-place edit per new field, drift risk.
- **P2** Draft encode/decode split (useAutoSaveDraft.ts:26-33 vs ComposerInput.tsx:98-104) — centralize one draft codec.
- **P2** ComposerState callbacks all optional though always supplied (definitions.ts:96-102) — make required, drop `?.` noise.
- **P3** useComposerRoom double-subscription trap (ComposerStore.tsx:71-76).
  > REJECTED-PREVIOUSLY (partial): the "extract shared pairing helper" remedy = rejected DEBT-03 (iteration 4 — a generic factory adds more indirection than the 2 remaining 5-line duplicates warrant). useComposerRoom's roomUpdate pairing itself is the intended plan-008 pattern.
- **P3** ComposerStore under views/RoomView/ but consumers in containers/MessageComposer — seam ownership.
- **P3** ComposerInput.tsx 418-line god-component (pre-existing); dishonest dep arrays :114,139.
- **P3** useAutocompleteA11yAnnounce good; 800ms magic number. Verify no external consumer of dropped `ComposerAttachments` barrel export.

### arch-roomview (RoomView) — DONE

- **P1** Thread-navigation duplicated: `navToThread` (useRoomNavigation.ts:50-103) vs `onThreadPress` (useRoomMessageHandlers.tsx:79-132), ~40 near-identical lines, already drifting (cancel-button behavior differs). Extract `navigateToThread` service with optional `onCancel`.
- **P2** `useReadOnly` dead `roomStoreOverride` param (useReadOnly.ts:14) — no caller passes it; drop.
- **P2** `onReactionPress`/`onReactionClose` byte-identical in useMessageActions.tsx:98-117 and useRoomMessageHandlers.tsx:177-196 — extract.
- **P2** Send flow duplicated: `handleSendMessage` (useRoomActions.ts:9-19) vs `onAnswerButtonPress` (useRoomMessageHandlers.tsx:221-231) — one service.
- **P2** RoomMessageHandlersBridge publishes fresh 13-closure handler bag every render → store.setState every render → subscriber churn (RoomMessageHandlersBridge.tsx:16-18); outside React Compiler reach. Memoize bag on real deps.
  > STALE (premise): arch-verify (PARTIAL 2) found NOT every render — deps [store,handlers] with 'use memo' on the hook; fires only on identity shifts. Downgrade severity; "every render" claim is wrong.
- **P2** `useMessageActions` 15-function grab-bag, thin wrappers over store actions, leaks 3 refs + actionSheet inward — split by concern or push into store actions slice.
- **P3** Navigation scattered across 4+ modules, each re-deriving isMasterDetail branch — centralize `roomNavigation` service.
- **P3** useHeader effect keys on whole `room` object (useHeader.tsx:85) — select narrow fields.
- **P3** useRoomNavigation hand-rolled live-ref (:38,114-116) — swap for `useLiveRef`.

## Wave 2 (spawned ~12:05 BRT)

- arch-tests: test architecture across PR
- arch-types: types/definitions/TS strictness in diff
- arch-storelayer: RoomView stores layer deep dive (RoomStore/MessageActionStore/ComposerStore interplay)
- arch-redux: redux/selectors/sagas/actions touched
- arch-crosscut: cross-module consistency + docs (ARCHITECTURE.md, CONTEXT.md, conventions)

### arch-tests (test architecture) — DONE

- **P1** 172,954-line Message snapshot (moved −177k/+172k) is noise — replace with targeted queries/scoped inline snapshots; LoadMore.test.tsx.snap (7,822 lines) same smell.
- **P1** `mockedStore` mutable singleton shared across 9+ test files, never reset (`app/reducers/mockedStore.ts:10`) — per-file/per-test `createMockedStore()`.
  > STALE (severity): arch-verify (PARTIAL 5) — jest per-file module registry isolates; no cross-file leak today. Downgrade to low smell.
- **P2** Six new RoomView hooks untested: useUnreadsCount, useRoomSubscription, useMessageSeparators, useE2EEStatus, useIsIgnored, useThreadBadgeColor.
  > VALID (confirmed at HEAD — no test files for any of the six). Plans 005/007 added hook suites but scoped to lifecycle/navigation/composer/rightButtons/etc; these six remain uncovered. Note 007 hit a 12-mock ceiling — extend by extracting a service, not adding mocks.
- **P2** RoomView services untested: getMessages, jumpToMessage, toggleFollowThread, fetchThreadName, blockAction, getMessageInfo (mocked everywhere, tested nowhere).
  > VALID (confirmed at HEAD — services/ has tests only for anchorResolver/getLocalAnchor/resolveJumpAnchor; the six named services have none). High leverage per 007's note (extract-a-service is the next test-coverage move).
- **P2** RoomStore.test afterEach forces teardown via double-release refcount underflow (:91-98) — breaks silently if release guards negatives; add explicit reset seam or invariant assert.
- **P3** reactCompilerContract EXTRA_FILES hardcodes 3 cross-dir paths (:11-15) — silently drops coverage on move.
  > PARTIALLY-ADDRESSED (plan 011): the contract itself was built by 011 (`2b37d2bd8`, KNOWN_SKIPPED now empty). This is a refinement of that artifact, not new territory.
- Positive: testHelpers fencing in jest.config; store DI pattern (createMessageActionStore + inertStore) = convention to hold; no LokiJS, no test-only prod code.

### arch-redux (redux consumption) — DONE

- **P1** RoomView top component still legacy `connect(mapStateToProps)` with 8 props (index.tsx:330-341) while whole subtree is hooks; blocks 'use memo'. Replace with useAppSelector hooks, drop remaining withX HOCs.
  > STALE (premise): arch-verify (PARTIAL 6) — RoomView HAS 'use memo' at index.tsx:57; drop the "blocks 'use memo'" claim. The connect→hooks migration is still a valid cleanup, just not a compiler blocker.
- **P1** `getUserSelector` fanned across 5 subscription sites (index, useReadOnly:26, useRoomMessageHandlers:47, RightButtons:105, LeftButtons:32) — add `useCurrentUser()`/`useCurrentUserId()` seam.
- **P2** `server.version` double source: prop path vs `reduxStore.getState()` in RoomStore.ts:112 — standardize.
- **P2** useReadOnly over-subscribes whole user, uses only username+roles (:26,33) — narrow.
- **P2** Selector-narrowing convention inconsistent (whole-object vs field-narrowed) — pick narrow-to-primitive.
- **P3** getUserSelector is identity reselect (no memo value); baseUrl reached two ways; useInAppFeedback whole-slice sub acceptable.

### arch-storelayer (zustand layer as system) — DONE

- **P1** Five stores hand-roll identical context+selector+throw scaffold (RoomStoreContext.tsx:6-14, ComposerStore.tsx:17-25, MessageActionStore.tsx:54-80, MessageRoomStore.tsx:42-50, MessageStore.tsx:50-58) — extract `createStoreContext(name)` factory; enabling refactor for #degrade/#selector/#room-model items.
- **P1** Two divergent lifetime models; RoomStore registry+refcount+sweep bespoke/inlined (RoomStore.ts:145-217) — extract generic `createRefCountedRegistry` or document as RoomStore-only.
- **P1** Hydration as 3 independent booleans `loading/subscribed/joined` (definitions.ts:167-171) — illegal states representable; use discriminated `status` union.
- **P2** Degrade-vs-throw inconsistent: inertStore/fallbackRoomStore vs throwing hooks — no rule for rendering outside provider.
- **P2** WMDB "room mutates in place → subscribe roomUpdate" workaround duplicated verbatim (RoomStoreContext.tsx:16-22, ComposerStore.tsx:71-76) — one shared `useRoomModel` helper.
  > REJECTED-PREVIOUSLY: this is DEBT-03 (rejected iteration 4). Only 2 true duplicates remain (useRoomWithUpdate/plan-006, useComposerRoom/plan-008), each over a different store/context and pinned by its own regression test; a generic factory adds more indirection than it removes.
- **P2** Action-placement diverges: inline mutations vs `actions` bag vs prop-injected handlers — pick convention.
- **P2** Process-global registry Map never cleared on logout/server switch (RoomStore.ts:152) — stale WMDB observers can survive re-login; add teardown seam.
- **P3** peekOrCreateRoomStore no-rid path returns orphan store without observer/registry (RoomStore.ts:180-182) — same type, different capabilities.
- **P3** Selector-granularity uneven (useShallow+guards vs bare passthroughs vs raw inline useStore in index.tsx:134-138).
- **P3** A11yGate plain React context in stores/ dir — paradigm outlier.

### arch-types (type architecture) — DONE

- **P1** `roomUpdate` typed `{[K in keyof TSubscriptionModel]?: any}` (definitions.ts:69-71) — use `Partial<TSubscriptionModel>`; one edit restores typing chain, removes RoomStore.ts:87,:133 casts.
  > VALID (confirmed at HEAD — definitions.ts:69-71 unchanged). Caveat: arch-verify (PARTIAL 4) — not a compile-clean drop-in; RoomStore.ts:131-134 needs a cast ("not assignable to never"). Plan 002 typed the composer store but did NOT touch these RoomView `any`s.
- **P1** `member: any` (definitions.ts:72) though producer typed — type as user shape.
- **P1** `Function` callback props ×3 (definitions.ts:149, :242, :35) — real signatures.
- **P1** New IUseMessageActionsResult reintroduces `any`/`Function` (definitions.ts:278-279) — use TActionSheetOptions + concrete signatures.
  > VALID (confirmed at HEAD: definitions.ts:35 `replyBroadcast:Function`, :72 `member:any`, :242 `onJoin:Function`, :278-279 `handleCloseEmoji`/`handleShowActionSheet` any/Function all present). Plan 002 (composer-store-typing) only de-`any`'d the composer store — these RoomView `any`/`Function` are untouched. All arch-types P1s valid.
- **P2** IRoomViewState.room union not discriminated → `'id' in` checks + `as` casts; `t: string` forces `t as RoomType`.
- **P2** New store types break I/T naming prefix (RoomState, ComposerState, RoomStore… ; RoomStore type collides with module name).
- **P2** TGetMessageInfoResult loose scalars (`rid: string|undefined`, mixed ts unions ×3) — narrow + single `TMessageTimestamp` alias.
- **P3** EMPTY_ROOM `t:''` sentinel; `Promise<void|undefined>` returns; `{tmid:string}` arm ×3 → `TThreadNavTarget`.

### arch-crosscut (consistency + docs) — DONE

- **P1** message/docs/ARCHITECTURE.md stale: still claims MessageRoomStore holds baseUrl/user/settings + FROZEN_KEYS never-resync — contradicted by f4f33cc62 redux move (MessageRoomStore.tsx:183-184).
- **P1** No ARCHITECTURE doc for the RoomView decomposition itself (2009→341 lines, 23 hooks + stores/services/components) — docs only cover Message Loading.
- **P2** A11yGate misfiled in message/stores/ (React context, not zustand) + absent from docs table.
- **P2** RoomView ARCHITECTURE.md/FLOWS.md still reference class component/componentDidMount (ARCHITECTURE.md:139, FLOWS.md:189) — logic now in useRoomNavigation/useJumpToMessage/useRoomInit.
  > PARTIALLY-ADDRESSED (plan 003): plan 003 (architecture-doc-drift, `9417a85a7`) dropped removed-guard references in RoomView docs but was scoped to guard refs, not the class-component/lifecycle language — verify these specific lines still stand at HEAD before planning.
- **P2** a11y naming split: MessageA11yIndex vs MessageAccessibleIndex (latter wraps former) — one prefix.
- **P3** "PR #7455" hard-coded in doc (no-noise rule); doc overstates coverage ("Verified by constants.test.ts" — hooks' derivation untested).
- Clean: CONTEXT.md rename complete; deleted barrels left no dangling imports.

## Wave 3 (spawned ~12:09 BRT)

- arch-jumppipeline: message-load/jump pipeline deep dive (List + services)
- arch-a11y-i18n: a11y + i18n patterns in diff
- arch-errors: error handling/logging/analytics consistency
- arch-perf: render/perf architecture (list virtualization, providers, compiler)
- arch-verify: adversarial verification of wave-1/2 P1s (false-positive check)

### arch-errors (errors/logging/analytics) — DONE

- **P1** `sendMessage().then()` no `.catch` in useRoomActions.ts:14-17 + useRoomMessageHandlers.tsx:226-229 — unhandled rejection; logEvent fires pre-send so analytics disagree with pushPositiveEvent.
- **P1** `console.log` instead of `log()` in catches: RoomStore.ts:92 (readMessages), useSubscriptionUnreads.ts:35, useThreadFollowing.ts:25 — invisible in prod telemetry.
  > VALID (confirmed at HEAD — RoomStore.ts:92 `readMessages(...).catch(e => console.log(e))` still present; the init-level catch already uses `log(e)`). Plan 004's silent-catch work did not cover this line.
- **P2** RoomStore has no error state — load failure renders as empty room, no retry (RoomStore.ts:100-103).
- **P2** useCloseBanner bare `catch {}` swallows DB write failure (:16-18) — add log(e).
- **P2** getCanReturnQueue silently degrades to false without log (useOmnichannelPermissions.ts:11-13).
- **P2** logEvent-before-async convention counts attempts not outcomes (joinRoom.ts:10,:35 + send) — fire on success or add failure events.
- **P3** getRoomMember `{}` for both error and non-DM; jumpToMessage reply-path only alerts one error shape (dead tap otherwise); pushPositiveEvent placement inconsistent.

### arch-jumppipeline (load/jump pipeline) — DONE

- **P1** jumpToMessage service has no cancellation token (jumpToMessage.ts:32-76); cancel only hides overlay — stale jump can fire `listRef.jumpToMessage` after room switch. Add AbortSignal/generation counter ("JumpRequest owns cancellation").
  > REJECTED-PREVIOUSLY (overlap): BUG-04 ("jump-to-message race on slow anchor resolve") was rejected — useScroll's retry loop already covers the window. The room-switch-generation framing here is a slightly different angle; if kept, argue why the retry loop is insufficient before planning.
- **P2** Anchor resolution spread over 4 modules producing bare `number|null`; equal-ts collision undetectable on local path — deepen to `(ts,id)` anchor descriptor.
- **P2** ts-only windowing pervasive fragile seam (`Q.lte(highTs)`, useMessages.ts:167,178) — id would disambiguate; high leverage, wide blast radius.
- **P2** Two owners of "current anchor" (service-computed highTs vs useMessages.raiseOrReleaseAnchor) — candidate `MessageWindow` deep module owning bound + rejoin.
- **P2** useScroll god-hook ~320 lines, 5 interleaved state machines coordinated by declaration-order layout effects (:216-221) — extract pure jump/retry reducer.
- **P2** Dead/latent `!message.replies` gate (jumpToMessage.ts:47) — getMessageInfo never populates replies; correctness check needed.
- **P3** raiseOrReleaseAnchor manual staleness guards inside rxjs emit (useMessages.ts:89,103,124); pagination window size = mutable `count` ref mutated from 4 sites; getMessages shallow dispatcher; `fetchMessages` overloaded verb (paginate/growToTarget/seed).

### arch-a11y-i18n — DONE

- **P1** `useLastFocusedMessageRef` module-global `let lastRef` shared across RoomView instances (lib/a11y/useLastFocusedMessageRef.ts:6) — tablet master-detail cross-instance focus leak; move into per-room store/context.
- **P2** useIsAccessibilityNavigationEnabled: reactive screen-reader sub + one-shot `isExternalKeyboardConnected()` read — gate drifts when keyboard connects mid-session; make subscription.
- **P2** A11y ordering as bare magic indices split across files (MessageTouchable.tsx:59 `index={1}`, MessageAccessibleIndex.tsx:19 `index={2}`, no 0) — named const/enum.
- **P2** useMessageAccessibilityLabel ~80-line god-hook: join(' ') + hardcoded punctuation (not localizable), `toLocaleTimeString()` device locale vs app locale, `'en'` fallback — one I18n template key.
- **P2** Reactions a11y label inline non-i18n unpluralized (Reactions.tsx:67).
- **P2** useAutocompleteA11yAnnounce (containers/) imports views/RoomView/stores/ComposerStore — layering inversion.
- **P3** A11yGateProvider hand-wired at 5 sites (silent failure if forgotten) — fold into shared message-list container; a11y timing constants scattered 3 places; stripMentions replaceAll string surgery vs structured mention data.

### arch-perf (render/perf, static) — DONE

- **P1** `renderItem` recreated every RoomView render (index.tsx:223); RoomView unmemoized (HOC chain :360) with 5 volatile store subs → fresh `renderRow` nullifies ListContainer 'use memo' → FlatList re-renders. Hoist row renderer into stable memoized boundary.
  > STALE (premise): arch-verify (PARTIAL 6) — RoomView HAS 'use memo' (index.tsx:57), so "RoomView unmemoized" is wrong. The renderItem-hoist point may still hold; re-verify the compiled `renderRow` identity before planning.
- **P2** List.tsx no 'use memo'; inline `keyExtractor`/`renderScrollComponent` recreated per render (:53,57-61) while re-rendering on scroll-threshold + autocomplete state.
- **P2** RoomMessageHandlersBridge (setState-every-render) placed as direct parent of List — placement load-bearing; move to sibling/leaf.
  > STALE (premise): see arch-verify PARTIAL 2 — Bridge does NOT setState every render (deps [store,handlers] + 'use memo', fires on identity shifts only).
- **P3** Per-row MessageProvider store + 3 props→store mirror effects ×~20 rows (message/index.tsx:25, MessageStore.tsx:135,143-166) — compiler-opaque pattern.
- **P3** O(rows×selectors) recompute on every RoomStore emit (useIsIgnored/useThreadBadgeColor/useMessageSeparators per row); getBadgeColor allocates arg object per call.
- **P3** Inline style object index.tsx:275; redundant manual `memo()` + 'use memo' double-wrap (message/index.tsx:38).

### arch-verify (adversarial check of top P1s) — DONE

- CONFIRMED: thread-nav dup (1); goRoom require inversion (3); MessagesView dup (7); 5-store scaffold congruent (8); action.kind smear (9); stale ARCHITECTURE.md (10).
- PARTIAL: (2) Bridge setState NOT every render — deps [store,handlers] w/ 'use memo' on hook; fires only on identity shifts. Downgrade severity.
- PARTIAL: (4) `Partial<TSubscriptionModel>` right direction but not compile-clean drop-in (RoomStore.ts:131-134 needs cast — TS "not assignable to never").
- PARTIAL: (5) mockedStore — jest per-file module registry isolates; no cross-file leak today. Downgrade to low smell.
- PARTIAL: (6) connect+8 props confirmed BUT RoomView HAS 'use memo' at index.tsx:57 — drop the "blocks compiler" part.

## Wave 4 (spawned ~12:14 BRT)

- arch-behavior: refactor-hidden behavior changes vs develop (regression risk)
- arch-stories: storybook/stories + fixture quality
- arch-e2e: maestro/e2e + CI script changes

### arch-e2e — DONE

- **P2** Uncommitted `reassure ^1.5.1` devDep + pnpm-lock drift in working tree (NATIVE-1427 POC) — keep out of this refactor PR; pin if kept.
- **P3** All committed e2e/CI changes sound: jest testHelpers ignore, ignoreuser extendedWaitUntil (rerender-tap fix), threads back-nav asserts exercise new useHeader testID, maestro timeout 120→300s, ANR handler. No P1, no lost assertions.

### arch-stories — DONE

- **P1** Message.stories provider stack diverges from prod: 105/107 stories lack MessageActionProvider, ride inert fallback; any leaf consuming useMessageAction later → prod fine, all stories crash. Wrap decorator in MessageActionProvider + explicit inert variant.
- **P2** Two bootstrap conventions: leaves per-file createMockedStore vs Message.stories mutating shared singleton at module load (:60-69) — standardize per-file.
- **P2** Fixture typing bypass: `Partial<MessageRoomState>` spread + `as unknown as TAnyMessageModel` — fixtures drift with no compile guard.
- **P3** Story-only shadow of prod grouping derivation (buildItem helpers :158-199); no shared buildMessage factory across stories+tests; store-state coverage gaps (inert/resync/loading variants).

### arch-behavior (class→hooks regression hunt) — DONE

- **P1** init() failure retry loop dropped (old: setTimeout 300ms retry; new RoomStore.init: log + loading:false, no recovery). Deliberate per map decision ("no retry timer") but user-visible on flaky connections — needs sign-off.
  > REJECTED-PREVIOUSLY (deliberate): the "no retry timer" arch decision is recorded (RoomView arch-improvements map / plan-004 hardening). Not a defect to fix — at most a sign-off item. Overlaps arch-errors P2 "RoomStore has no error state".
- **P2** In-app-feedback haptic: per-message in-render → single focus-gated batch (timing/feel differs).
- **P2** Init trigger: SDK 'connected' event → reactive redux isAuthenticated.
- **P2** readOnly: async DB hasPermission → isReadOnlySync from redux/room roles — parity spot-check read-only rooms.
- **P2** joined: latched-once → continuously derived per observeRoom emit — watch omnichannel take/preview transitions.
- **P3** initialRoom gains visitor/joinCodeRequired (additive fix); unloadRoomAudios not awaited; rest faithfully ported.
- QA suggestion: flaky-connection load, notification haptics, read-only rooms, omnichannel join transitions.

## Cross-check summary

Cross-checked all findings against plans/README.md (plans 001–017 DONE, rejected-findings list, iteration 9–10 convergence). Verified questionable items against code at HEAD (definitions.ts, RoomStore.ts, services/, hooks/**tests**/). Annotations added to 14 findings.

Counts (~63 substantive findings across 15 lenses):

- **Rejected/stale-premise: 8** — 3 REJECTED-PREVIOUSLY (storelayer WMDB-dup=DEBT-03, jumppipeline cancellation≈BUG-04, behavior init-retry=deliberate), 5 STALE-premise (roomview Bridge-setState, perf Bridge-placement, redux connect-blocks-compiler, perf renderItem/unmemoized, tests mockedStore-leak — all downgraded by arch-verify or contradicted by 'use memo' at index.tsx:57).
- **Partial/scoped: 3** — tests reactCompilerContract (plan 011 artifact), crosscut RoomView-doc lifecycle refs (plan 003 scope), composer useComposerRoom-dup (DEBT-03 remedy rejected, pattern is plan-008).
- **Valid (confirmed at HEAD): ~52** — the bulk, incl. all newly-verified arch-types `any`/`Function`, arch-errors console.log, untested services + six hooks.

Prior work (001–017) targeted the React-Compiler de-suppression arc + roomUpdate stale-render class + RoomView typing/hardening. This review's still-valid findings are mostly ORTHOGONAL: shared-infra dedup, cross-view scaffolding, error/telemetry hygiene, type-system tightening in NEW surfaces, docs, and test coverage — largely outside 001–017's scope.

Top 10 still-valid by leverage:

1. **arch-storelayer P1** — 5 stores hand-roll identical context+selector+throw scaffold → extract `createStoreContext(name)`. Enabling refactor for degrade/selector/room-model items; confirmed congruent by arch-verify.
2. **arch-types P1** — `roomUpdate: {[K]?:any}` → `Partial<TSubscriptionModel>` (+ member/Function props). One-area fix restores typing chain across RoomStore; verified present at HEAD. (Needs a cast per arch-verify.)
3. **arch-roomview P1 / arch-errors P1** — thread-nav duplicated & drifting (navToThread vs onThreadPress) + send-flow dup, both with unhandled `sendMessage().then()` (no `.catch`). Correctness + dedup in one service.
4. **arch-crosscut P1** — message/docs/ARCHITECTURE.md stale (still claims MessageRoomStore holds baseUrl/user, contradicted by f4f33cc62) + no RoomView-decomposition doc. Confirmed by arch-verify.
5. **arch-tests P2** — six new RoomView hooks + six services untested (confirmed at HEAD). Highest coverage gap; extract-a-service unlocks it past the 12-mock ceiling.
6. **arch-composer P1** — `action.kind` union smeared across 4 modules → `useIsEditing()`/`useQuotedMessageIds()` selectors on MessageActionStore. Confirmed by arch-verify.
7. **arch-storelayer P1** — hydration as 3 independent booleans (loading/subscribed/joined) → discriminated `status` union; kills illegal states.
8. **arch-redux P1** — `getUserSelector` fanned across 5 sites → `useCurrentUser()`/`useCurrentUserId()` seam.
9. **arch-a11y-i18n P1** — `useLastFocusedMessageRef` module-global `let lastRef` → tablet master-detail cross-instance focus leak; move to per-room store.
10. **arch-views P1** — MessagesView ↔ SearchMessagesView duplicated scaffolding → shared `MessageListScreen`. (Note: overlaps the MessagesView→7455 memory map; likely out of THIS PR's scope.)
