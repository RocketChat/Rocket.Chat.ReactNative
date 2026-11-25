type View = 'sectionRow' | 'syncRow' | 'badge';
type Shown = 'unmounted' | 'transparent' | 'fadingIn' | 'opaque' | 'fadingOut';

const views: View[] = ['sectionRow', 'syncRow', 'badge'];

let reducedMotion!: boolean;

let isToggling = false;
let toggleWindow: 'unset' | 'open' | 'elapsed' = 'unset';
let windowOpenedByCommit = false;
let disarmPending = false;

let commitPending = false;
let collapsed = false;
let toggles = 0;
let syncInserts = 0;

let shown: Record<View, Shown> = { sectionRow: 'opaque', syncRow: 'unmounted', badge: 'unmounted' };
let cover: 'hidden' | 'covering' | 'stuck' = 'hidden';

let insideToggle = false;
let fadedOutsideToggle = false;
let fadedUnderReducedMotion = false;

const openWindowOnFirstAnimation = () => {
	if (!reducedMotion && isToggling && toggleWindow === 'unset') toggleWindow = 'open';
};

const fades = () => !reducedMotion && isToggling && toggleWindow === 'open';

const noteFade = () => {
	if (!insideToggle) fadedOutsideToggle = true;
	if (reducedMotion) fadedUnderReducedMotion = true;
};

const mount = (v: View) => {
	openWindowOnFirstAnimation();
	if (fades()) {
		noteFade();
		shown[v] = 'fadingIn';
	} else {
		shown[v] = 'opaque';
	}
};

const unmount = (v: View) => {
	openWindowOnFirstAnimation();
	if (fades()) {
		noteFade();
		shown[v] = 'fadingOut';
	} else {
		shown[v] = 'unmounted';
	}
};

/** You tap a section's collapse/expand chevron: onToggle arms the fade and calls toggleGroup. */
export const tapToggle = () => {
	if (commitPending || toggles >= 2) return;
	toggles += 1;
	isToggling = true;
	toggleWindow = 'unset';
	windowOpenedByCommit = false;
	insideToggle = true;
	commitPending = true;
};

/** React commits the new collapsedGroups: the section's rows and the header badge mount or unmount, and the reveal cover remounts. */
export const commitToggle = () => {
	if (!commitPending) return;
	commitPending = false;
	collapsed = !collapsed;
	disarmPending = true;
	const unsetBefore = toggleWindow === 'unset';
	if (collapsed) {
		unmount('sectionRow');
		mount('badge');
	} else {
		mount('sectionRow');
		unmount('badge');
	}
	if (unsetBefore && toggleWindow === 'open') windowOpenedByCommit = true;
	const coverEntering = !reducedMotion;
	cover = coverEntering && isToggling ? 'covering' : 'hidden';
	if (cover !== 'hidden' && reducedMotion) fadedUnderReducedMotion = true;
};

/** A server sync adds a Room row to another section. */
export const syncInsertsRow = () => {
	if (syncInserts >= 1 || shown.syncRow !== 'unmounted') return;
	syncInserts += 1;
	mount('syncRow');
};

/** TOGGLE_SETTLE_MS passes after the toggle's first animation. */
export const toggleWindowElapses = () => {
	if (toggleWindow !== 'open') return;
	toggleWindow = 'elapsed';
	insideToggle = false;
};

/** UNUSED_TOGGLE_DISARM_MS passes after the last collapsedGroups change. */
export const disarmFires = () => {
	if (!disarmPending) return;
	if (toggleWindow === 'open' && windowOpenedByCommit) return;
	disarmPending = false;
	isToggling = false;
	insideToggle = false;
};

/** A fade spring finishes: a fading-in view is fully shown, a fading-out view is removed. */
export const fadeEnds = (v: View) => {
	if (shown[v] === 'fadingIn') shown[v] = 'opaque';
	else if (shown[v] === 'fadingOut') shown[v] = 'unmounted';
};

/** The reveal cover's TOGGLE_SETTLE_MS delay ends and its opacity drops to 0. */
export const coverHides = () => {
	if (cover !== 'covering') return;
	cover = 'hidden';
};

const atRest = () =>
	!commitPending && cover !== 'covering' && views.every(v => shown[v] !== 'fadingIn' && shown[v] !== 'fadingOut');

/** Once the animations settle, every mounted Room row and the badge are fully visible, and no cover hides them. */
export const everyMountedRowEndsVisible = () =>
	!atRest() || (views.every(v => shown[v] === 'unmounted' || shown[v] === 'opaque') && cover === 'hidden');

/** A fade runs only inside a section toggle: from the tap until its fades settle. */
export const toggleFadeOnlyInsideToggle = () => !fadedOutsideToggle;

/** With reduced motion on, no row or badge fades and the reveal cover never shows. */
export const reducedMotionSkipsFades = () => !fadedUnderReducedMotion;

/** @terminating */
export const settled = () => atRest() && !disarmPending && toggleWindow !== 'open';
