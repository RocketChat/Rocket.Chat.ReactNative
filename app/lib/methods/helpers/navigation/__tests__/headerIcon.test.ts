import { headerIcon, preloadHeaderIcons } from '../headerIcon';

const mockGetImageSource = jest.fn();
jest.mock('~/containers/CustomIcon', () => ({
	IconSet: { getImageSource: (...args: unknown[]) => mockGetImageSource(...args) }
}));

describe('headerIcon', () => {
	it('returns no icon before the header icons are preloaded', () => {
		expect(headerIcon('kebab')).toBeUndefined();
	});

	it('returns the rendered font glyph as an image once preloaded', async () => {
		mockGetImageSource.mockImplementation(async (name: string) => ({ uri: `file://${name}.png`, scale: 3 }));

		await preloadHeaderIcons();

		expect(headerIcon('kebab')).toEqual({ type: 'image', source: { uri: 'file://kebab.png', scale: 3 } });
		expect(mockGetImageSource).toHaveBeenCalledWith('kebab', 30, 'black');
	});
});
