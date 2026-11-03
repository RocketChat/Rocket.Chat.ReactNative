import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
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

	it.each(['light', 'dark', 'black'] as const)(
		'stripes the even rows with a color that differs from the room in the %s theme',
		async theme => {
			const msg = ['| Name |', '| - |', '| Alice |', '| Bob |'].join('\n');
			const { UNSAFE_getAllByType } = render(
				<ThemeContext.Provider value={{ theme, colors: colors[theme] }}>
					<Markdown msg={msg} md={parse(msg)} />
				</ThemeContext.Provider>
			);
			await act(async () => {});

			const backgrounds = UNSAFE_getAllByType(View)
				.map(view => StyleSheet.flatten(view.props.style)?.backgroundColor)
				.filter(Boolean);

			expect(backgrounds).toHaveLength(1);
			expect(backgrounds[0]).not.toBe(colors[theme].surfaceRoom);
		}
	);

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
