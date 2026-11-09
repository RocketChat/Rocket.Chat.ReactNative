import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { parse } from '@rocket.chat/message-parser';
import { Image as ExpoImage } from 'expo-image';

import Markdown from '~/containers/markdown';
import { ThemeContext } from '~/theme';
import { colors } from '~/lib/constants/colors';

jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => false)
}));

jest.mock('~/lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true])
}));

const setFontScale = (fontScale: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width: 390, height: 844, scale: 3, fontScale });

const renderMarkdown = async (lines: string[], onLinkPress?: jest.Mock) => {
	const msg = lines.join('\n');
	const result = render(<Markdown msg={msg} md={parse(msg)} onLinkPress={onLinkPress} />);
	await act(async () => {});
	return result;
};

describe('Table', () => {
	beforeEach(() => {
		setFontScale(1);
	});

	it('renders the header and every body cell', async () => {
		const { getByText } = await renderMarkdown(['| Name | Score |', '| - | - |', '| Alice | 9 |', '| Bob | 7 |']);

		['Name', 'Score', 'Alice', '9', 'Bob', '7'].forEach(text => expect(getByText(text)).toBeTruthy());
	});

	it('shrinks images inside cells to a thumbnail', async () => {
		const { UNSAFE_getByType } = await renderMarkdown(['| Logo |', '| - |', '| ![rc](https://rocket.chat/a.png) |']);

		expect(StyleSheet.flatten(UNSAFE_getByType(ExpoImage).props.style)).toMatchObject({ width: 48, height: 48 });
	});

	it('keeps images outside tables at their inline size', async () => {
		const { UNSAFE_getByType } = await renderMarkdown(['![rc](https://rocket.chat/a.png)']);

		expect(StyleSheet.flatten(UNSAFE_getByType(ExpoImage).props.style)).toMatchObject({ width: 300, height: 300 });
	});

	it('renders a header-only table', async () => {
		const { getByText } = await renderMarkdown(['| Only | Header |', '| - | - |']);

		expect(getByText('Only')).toBeTruthy();
		expect(getByText('Header')).toBeTruthy();
	});

	it('applies the column alignment to header and body cells', async () => {
		const { getByText } = await renderMarkdown(['| L | C | R |', '| :--- | :---: | ---: |', '| l | c | r |']);

		expect(getByText('C')).toHaveStyle({ textAlign: 'center' });
		expect(getByText('c')).toHaveStyle({ textAlign: 'center' });
		expect(getByText('R')).toHaveStyle({ textAlign: 'right' });
		expect(getByText('r')).toHaveStyle({ textAlign: 'right' });
		expect(getByText('l')).not.toHaveStyle({ textAlign: 'center' });
		expect(getByText('l')).not.toHaveStyle({ textAlign: 'right' });
	});

	it('aligns the cell box of centered and right aligned columns', async () => {
		const { UNSAFE_getAllByType } = await renderMarkdown(['| L | C | R |', '| :--- | :---: | ---: |', '| l | c | r |']);
		const cellsAligned = (alignItems: string) =>
			UNSAFE_getAllByType(View).filter(view => StyleSheet.flatten(view.props.style)?.alignItems === alignItems);

		expect(cellsAligned('center')).toHaveLength(2);
		expect(cellsAligned('flex-end')).toHaveLength(2);
	});

	it('scales column widths with the font scale', async () => {
		setFontScale(2);
		const { UNSAFE_getAllByType } = await renderMarkdown(['| a |', '| - |', '| b |']);

		const widths = UNSAFE_getAllByType(View).map(view => StyleSheet.flatten(view.props.style)?.width);

		expect(widths).toContain(160);
	});

	it.each([
		['light', 'rgba(47, 52, 61, 0.05)'],
		['dark', 'rgba(193, 199, 208, 0.05)'],
		['black', 'rgba(228, 228, 228, 0.05)']
	] as const)('stripes the even rows with a visible tint in the %s theme', async (theme, stripeColor) => {
		const msg = ['| Name | Score |', '| - | - |', '| Alice | 9 |', '| Bob | 7 |'].join('\n');
		const { UNSAFE_getAllByType } = render(
			<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
				<Markdown msg={msg} md={parse(msg)} />
			</ThemeContext.Provider>
		);
		await act(async () => {});

		const stripes = UNSAFE_getAllByType(View).filter(view => StyleSheet.flatten(view.props.style)?.backgroundColor);

		expect(stripes).toHaveLength(1);
		expect(StyleSheet.flatten(stripes[0].props.style).backgroundColor).toBe(stripeColor);
		expect(within(stripes[0]).getByText('Bob')).toBeTruthy();
		expect(within(stripes[0]).getByText('7')).toBeTruthy();
		expect(within(stripes[0]).queryByText('Alice')).toBeNull();
	});

	it.each(['light', 'dark', 'black'] as const)('outlines the table with the stroke color in the %s theme', async theme => {
		const msg = ['| Name | Score |', '| - | - |', '| Alice | 9 |'].join('\n');
		const { UNSAFE_getAllByType } = render(
			<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
				<Markdown msg={msg} md={parse(msg)} />
			</ThemeContext.Provider>
		);
		await act(async () => {});

		const outlines = UNSAFE_getAllByType(View).filter(view => StyleSheet.flatten(view.props.style)?.borderWidth === 1);

		expect(outlines).toHaveLength(1);
		expect(StyleSheet.flatten(outlines[0].props.style).borderColor).toBe(colors[theme].strokeLight);
		expect(within(outlines[0]).getByText('Alice')).toBeTruthy();
	});

	it('keeps links inside cells pressable', async () => {
		const onLinkPress = jest.fn();
		const { getByText } = await renderMarkdown(
			['| Name | Link |', '| - | - |', '| Carol | [profile](https://rocket.chat) |'],
			onLinkPress
		);

		fireEvent.press(getByText('profile'));

		expect(onLinkPress).toHaveBeenCalledWith('https://rocket.chat');
	});
});
