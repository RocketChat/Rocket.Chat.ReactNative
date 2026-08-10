// Lets a nested press target tell an ancestor it owns the current touch: on Android the message row is a
// gesture-handler Pressable while inline markdown links are plain <Text onLongPress>, and the two gesture
// systems cannot arbitrate, so without this a long press on a link fires both handlers.

// Bounds the damage if an end is ever missed, e.g. the text unmounts mid-press.
const MAX_PRESS_DURATION = 1000;

let startedAt: number | null = null;

export const beginNestedPress = () => {
	startedAt = Date.now();
};

export const endNestedPress = () => {
	startedAt = null;
};

export const isNestedPressActive = () => startedAt !== null && Date.now() - startedAt < MAX_PRESS_DURATION;
