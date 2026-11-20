import { buildMarkdownStyle } from '../buildMarkdownStyle';
import { colors as lightColors } from '~/lib/constants/colors';

const colors = lightColors.light;

describe('buildMarkdownStyle', () => {
	it('sizes images to big-emoji size for an emoji-only message', () => {
		const style = buildMarkdownStyle(colors, true, 1);
		expect(style.image?.maxHeight).toBe(30);
		expect(style.inlineImage?.size).toBe(30);
	});

	it('caps a block image to the regular attachment size otherwise', () => {
		const style = buildMarkdownStyle(colors, false, 1);
		expect(style.image?.maxHeight).toBe(300);
		expect(style.inlineImage?.size).toBe(19);
	});

	it('scales emoji sizes with the font scale', () => {
		expect(buildMarkdownStyle(colors, true, 2).inlineImage?.size).toBe(60);
		expect(buildMarkdownStyle(colors, true, 2).image?.maxHeight).toBe(60);
		expect(buildMarkdownStyle(colors, false, 2).inlineImage?.size).toBe(38);
		expect(buildMarkdownStyle(colors, false, 2).image?.maxHeight).toBe(300);
	});
});
