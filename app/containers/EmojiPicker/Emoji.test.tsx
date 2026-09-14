import { render, screen } from '@testing-library/react-native';

import { Emoji } from './Emoji';

const customEmojis = { clap: { name: 'clap', extension: 'png' } };

jest.mock('../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: any) => any) =>
		selector({ customEmojis, server: { server: 'https://open.rocket.chat' }, login: { user: {} } })
}));

describe('Emoji', () => {
	it('renders the custom emoji image when a shortname collides with a custom emoji', () => {
		render(<Emoji emoji='clap' />);

		expect(screen.queryByText(':clap:')).toBeNull();
	});

	it('renders the unicode emoji when there is no custom emoji with that name', () => {
		render(<Emoji emoji='thumbsup' />);

		expect(screen.getByText('👍️')).toBeOnTheScreen();
	});
});
