import { render, screen } from '@testing-library/react-native';

import RoomsListHeaderView from '../Header';

let mockAppState: Record<string, unknown>;
jest.mock('~/lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: typeof mockAppState) => unknown) => selector(mockAppState)
}));
jest.mock('../ServersList', () => () => null);

beforeEach(() => {
	mockAppState = {
		supportedVersions: { status: 'supported' },
		meteor: { connecting: false, connected: true },
		server: { loading: false, server: 'https://open.rocket.chat' },
		login: { isFetching: false },
		rooms: { isFetching: false },
		settings: { Site_Name: 'Rocket.Chat' }
	};
});

it('shows the server url as the subtitle', () => {
	render(<RoomsListHeaderView search={jest.fn()} searchEnabled={false} />);

	expect(screen.getByTestId('rooms-list-header-server-subtitle')).toHaveTextContent('open.rocket.chat');
});

it('shows that it cannot connect when the server version is expired', () => {
	mockAppState = { ...mockAppState, supportedVersions: { status: 'expired' } };

	render(<RoomsListHeaderView search={jest.fn()} searchEnabled={false} />);

	expect(screen.getByTestId('rooms-list-header-server-subtitle')).toHaveTextContent('Cannot connect');
});
