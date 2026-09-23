import { buildMarkdownStyle } from '../buildMarkdownStyle';
import { colors as lightColors } from '~/lib/constants/colors';

const colors = lightColors.light;

describe('buildMarkdownStyle', () => {
	it('caps a block image to big-emoji size for an emoji-only message', () => {
		const style = buildMarkdownStyle(colors, true);
		expect(style.image?.maxHeight).toBe(30);
		expect(style.inlineImage?.size).toBe(30);
	});

	it('caps a block image to the regular attachment size otherwise', () => {
		const style = buildMarkdownStyle(colors, false);
		expect(style.image?.maxHeight).toBe(300);
		expect(style.inlineImage?.size).toBe(15);
	});
});
