import { render, screen } from '@testing-library/react-native';

import LeftButtons from '../LeftButtons';
import { type RoomStore } from '../../definitions';

jest.mock('@react-navigation/native', () => ({
	useNavigation: () => ({ navigate: jest.fn() })
}));
jest.mock('../../../../lib/hooks/navigation', () => ({
	useAppNavigation: () => ({ goBack: jest.fn() })
}));
jest.mock('../../../../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => true
}));
jest.mock('../../hooks/useUnreadsCount', () => ({
	useUnreadsCount: () => null
}));
jest.mock('../../hooks/useGoRoomActionsView', () => ({
	useGoRoomActionsView: () => jest.fn()
}));
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: (selector: (state: unknown) => unknown) => selector({ server: { server: 'https://open.rocket.chat' } })
}));
jest.mock('../../../../selectors/login', () => ({
	getUserSelector: () => ({ id: 'user-1', token: 'token-1' })
}));
jest.mock('../../../../containers/Avatar', () => {
	const ReactActual = jest.requireActual('react');
	return {
		__esModule: true,
		default: ({ text, type }: { text?: string; type: string }) =>
			ReactActual.createElement('Avatar', { testID: 'left-buttons-avatar', text, type })
	};
});

let mockRoomState: { room: Record<string, unknown> } = { room: { rid: 'rid-1', t: 'c', name: 'general' } };
jest.mock('zustand', () => ({
	useStore: (_store: unknown, selector: (state: typeof mockRoomState) => unknown) => selector(mockRoomState)
}));

const roomStore = {} as RoomStore;

describe('LeftButtons', () => {
	beforeEach(() => {
		mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'general' } };
	});

	it('reflects the current room name from the store', () => {
		render(<LeftButtons rid='rid-1' roomStore={roomStore} />);

		expect(screen.getByTestId('left-buttons-avatar')).toHaveProp('text', 'general');
	});

	it('picks up a renamed room without a stale selector', () => {
		const { rerender } = render(<LeftButtons rid='rid-1' roomStore={roomStore} />);
		expect(screen.getByTestId('left-buttons-avatar')).toHaveProp('text', 'general');

		mockRoomState = { room: { rid: 'rid-1', t: 'c', name: 'renamed' } };
		rerender(<LeftButtons rid='rid-1' roomStore={roomStore} />);

		expect(screen.getByTestId('left-buttons-avatar')).toHaveProp('text', 'renamed');
	});
});
