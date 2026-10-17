import { colors } from '~/lib/constants/colors';
import { getRaisedHandColors } from '../getRaisedHandColors';

describe('getRaisedHandColors', () => {
	it.each(['light', 'dark', 'black'] as const)('gives our own raised hand the green of a success button (%s theme)', theme => {
		const palette = colors[theme];

		expect(getRaisedHandColors(palette, true)).toEqual({
			background: palette.buttonBackgroundSuccessDefault,
			text: palette.buttonFontSuccess
		});
	});

	it.each(['light', 'dark', 'black'] as const)('gives anybody else a white raised hand with dark text (%s theme)', theme => {
		const palette = colors[theme];

		expect(getRaisedHandColors(palette, false)).toEqual({ background: palette.fontPureWhite, text: palette.fontPureBlack });
		expect(palette.fontPureWhite).toBe('#FFFFFF');
	});

	it('tells our hand apart from everybody else', () => {
		expect(getRaisedHandColors(colors.light, true).background).not.toBe(getRaisedHandColors(colors.light, false).background);
	});
});
