import { headerIcon, headerTextIcon } from '../headerIcon';

describe('headerIcon', () => {
	it('points at the native symbol generated for the icon', () => {
		expect(headerIcon('kebab')).toEqual({ type: 'xcasset', name: 'nano.kebab' });
	});

	it('adds the tint color for title and subtitle glyphs', () => {
		expect(headerTextIcon('clock', 'gray')).toEqual({ type: 'xcasset', name: 'nano.clock', tintColor: 'gray' });
	});
});
