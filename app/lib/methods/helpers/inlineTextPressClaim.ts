/**
 * Bridges React Native's JS responder system and react-native-gesture-handler for inline text presses.
 *
 * On Android the message row is a gesture-handler Pressable, which arms its long press on touch down and
 * can only be cancelled through RNGH's own arbitration. Inline markdown links are plain
 * `<Text onLongPress>`, living in RN's responder system. The single bridge between the two is
 * `setJSResponder(tag, blockNativeResponder)` — RNGH cancels its handlers only when `blockNativeResponder`
 * is true (`RNGestureHandlerRootHelper.handleSetJSResponder`) — and `Text` cannot send that signal: it
 * omits the flag from its Pressability config and its `onResponderGrant` proxy discards Pressability's
 * return value. So a long press on a link fired the link's handler *and* the row's, dropping the message
 * action sheet on top of the "copied to clipboard" toast.
 *
 * Inline text therefore records here that it owns the current touch, and the row checks before acting.
 * The claim is taken on press in — at responder grant, well before either long-press timer elapses — so
 * this is an ordering guarantee rather than a race.
 */

// Bounds the damage if a release is ever missed (e.g. the text unmounts mid-press). A stale claim can then
// only suppress a long press for slightly longer than the press that would have consumed it.
const CLAIM_TTL = 1000;

let claimedAt: number | null = null;

export const claimInlineTextPress = () => {
	claimedAt = Date.now();
};

export const releaseInlineTextPress = () => {
	claimedAt = null;
};

export const hasInlineTextPressClaim = () => claimedAt !== null && Date.now() - claimedAt < CLAIM_TTL;
