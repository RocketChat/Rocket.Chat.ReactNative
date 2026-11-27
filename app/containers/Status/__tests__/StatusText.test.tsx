import { render, screen } from '@testing-library/react-native';

import StatusText from '../StatusText';

jest.mock('~/containers/markdown', () => ({
	__esModule: true,
	default: ({ msg, allowImages }: { msg: string; allowImages?: boolean }) => {
		const { Text } = require('react-native');
		return <Text>{`${msg}|${String(allowImages)}`}</Text>;
	}
}));

describe('StatusText', () => {
	it('renders the status text through the markdown renderer with images disabled', () => {
		render(<StatusText msg=':rcbadge: on vacation' />);

		expect(screen.getByText(':rcbadge: on vacation|false')).toBeTruthy();
	});

	it('disables images so status text cannot load remote hosts', () => {
		render(<StatusText msg='![tracker](https://example.com/tracker.png) on vacation' />);

		expect(screen.getByText('![tracker](https://example.com/tracker.png) on vacation|false')).toBeTruthy();
	});
});
