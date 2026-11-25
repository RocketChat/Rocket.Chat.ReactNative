type Vars = Record<string, any>;

export const title = 'Rooms list: section toggle and row animations';

const isMoving = (v: Vars) =>
	v.cover === 'covering' ||
	['sectionRow', 'syncRow', 'badge'].some(view => v.shown[view] === 'fadingIn' || v.shown[view] === 'fadingOut');

const phase = (v: Vars) => {
	if (v.commitPending) return 'Tap registered, list not redrawn yet';
	if (isMoving(v)) return v.collapsed ? 'Collapsing: rows fade out' : 'Expanding: rows fade in';
	return v.collapsed ? 'Section collapsed' : 'Section expanded';
};

export const state = (v: Vars) => [v.reducedMotion ? 'Reduced motion on' : 'Reduced motion off', phase(v)];

export const step = (action: string) => {
	switch (action) {
		case 'tapToggle':
			return 'you tap the section chevron';
		case 'commitToggle':
			return 'the list redraws the section';
		case 'syncInsertsRow':
			return 'a sync adds a Room row';
		case 'fadeEnds':
		case 'coverHides':
			return 'the fade finishes';
		default:
			return null;
	}
};
