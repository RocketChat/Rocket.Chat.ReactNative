import { colors } from '~/lib/constants/colors';
import { getControlColors } from '../getControlColors';

describe('getControlColors', () => {
	it.each(['light', 'dark', 'black'] as const)('uses the %s theme secondary button for a plain control', theme => {
		const palette = colors[theme];

		expect(getControlColors(palette, 'default', false)).toEqual({
			background: palette.buttonBackgroundSecondaryDefault,
			icon: palette.buttonFontSecondary
		});
		expect(getControlColors(palette, 'default', true).background).toBe(palette.buttonBackgroundSecondaryPress);
	});

	it.each(['light', 'dark', 'black'] as const)('fills a muted or ending control with the %s theme danger colour', theme => {
		const palette = colors[theme];

		expect(getControlColors(palette, 'danger', false)).toEqual({
			background: palette.buttonBackgroundDangerDefault,
			icon: palette.buttonFontDanger
		});
		expect(getControlColors(palette, 'danger', true).background).toBe(palette.buttonBackgroundDangerPress);
	});

	it('shows a toggled-on control as a lighter fill with a blue icon, whether or not it is pressed', () => {
		const palette = colors.dark;

		expect(getControlColors(palette, 'toggled', false)).toEqual({
			background: palette.buttonBackgroundSecondaryPress,
			icon: palette.fontInfo
		});
		expect(getControlColors(palette, 'toggled', true)).toEqual(getControlColors(palette, 'toggled', false));
	});
});
