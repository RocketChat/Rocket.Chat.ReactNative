import { render, screen } from '@testing-library/react-native';

import StatusText, { stripMarkdownImages } from '../StatusText';

jest.mock('~/containers/markdown', () => ({
	__esModule: true,
	default: ({ msg }: { msg: string }) => {
		const { Text } = require('react-native');
		return <Text>{msg}</Text>;
	}
}));

describe('StatusText', () => {
	it('renders status text through the markdown renderer', () => {
		render(<StatusText msg=':rcbadge: on vacation' />);

		expect(screen.getByText(':rcbadge: on vacation')).toBeTruthy();
	});

	it('strips remote images so opening a profile cannot contact their hosts', () => {
		render(<StatusText msg='![tracker](https://example.com/tracker.png) on vacation' />);

		expect(screen.queryByText(/tracker\.png/)).toBeNull();
		expect(screen.getByText('tracker on vacation')).toBeTruthy();
	});
});

describe('stripMarkdownImages', () => {
	it('replaces an image with its alt text', () => {
		expect(stripMarkdownImages('![alt](https://example.com/a.png)')).toBe('alt');
	});

	it('leaves links and plain text untouched', () => {
		expect(stripMarkdownImages('[link](https://example.com) :rcbadge:')).toBe('[link](https://example.com) :rcbadge:');
	});
});
