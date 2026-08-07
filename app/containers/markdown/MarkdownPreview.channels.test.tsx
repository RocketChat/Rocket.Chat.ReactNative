import { render } from '@testing-library/react-native';

import { MarkdownPreview } from '.';

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => false)
}));

jest.mock('../../lib/methods/userPreferences', () => ({
	useUserPreferences: jest.fn(() => [true])
}));

// Previews (composer quote, sent quote, thread previews) render plain text rather than the
// markdown tree, so they resolve discussion mentions through `channels` themselves.
describe('MarkdownPreview channel mentions', () => {
	it('shows a discussion mention by its fname instead of the room id', () => {
		const { queryByText } = render(
			<MarkdownPreview msg='see #aBcD123xyz' channels={[{ _id: 'r1', name: 'aBcD123xyz', fname: 'My Discussion' }]} />
		);

		expect(queryByText('see #My Discussion')).toBeTruthy();
		expect(queryByText('see #aBcD123xyz')).toBeNull();
	});

	it('resolves a mention that is the entire message', () => {
		const { queryByText } = render(
			<MarkdownPreview msg='#aBcD123xyz' channels={[{ _id: 'r1', name: 'aBcD123xyz', fname: 'My Discussion' }]} />
		);

		expect(queryByText('#aBcD123xyz')).toBeNull();
		expect(queryByText('#My Discussion')).toBeTruthy();
	});

	it('leaves a regular channel mention untouched', () => {
		const { queryByText } = render(<MarkdownPreview msg='see #general' channels={[{ _id: 'r1', name: 'general' }]} />);

		expect(queryByText('see #general')).toBeTruthy();
	});

	it('renders unchanged when no channels are supplied', () => {
		const { queryByText } = render(<MarkdownPreview msg='see #aBcD123xyz' />);

		expect(queryByText('see #aBcD123xyz')).toBeTruthy();
	});
});
