import { colors } from '~/lib/constants/colors';
import { getControlColors } from '../getControlColors';

describe('getControlColors', () => {
	it.each(['light', 'dark', 'black'] as const)(
		'shows a toggled-on control the same whether or not it is pressed (%s theme)',
		theme => {
			const palette = colors[theme];

			expect(getControlColors(palette, 'toggled', true)).toEqual(getControlColors(palette, 'toggled', false));
		}
	);

	it.each(['default', 'danger'] as const)('shows a %s control differently while it is pressed', variant => {
		const palette = colors.light;

		expect(getControlColors(palette, variant, true).background).not.toBe(getControlColors(palette, variant, false).background);
	});
});
