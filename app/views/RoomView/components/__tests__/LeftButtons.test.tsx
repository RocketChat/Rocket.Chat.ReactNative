import { act, render, screen } from '@testing-library/react-native';

import { createRoomStore, observeRoom } from '../../stores/RoomStore';
import { setupObserveRoomDatabase } from '../../stores/__tests__/observeRoomHarness';
import LeftButtons from '../LeftButtons';

const mockAvatarRender = jest.fn();

jest.mock('../../../../lib/database', () => ({
	__esModule: true,
	default: { active: { get: jest.fn() } }
}));
jest.mock('../../../../containers/Avatar', () => {
	const { Text: MockText } = require('react-native');
	return {
		__esModule: true,
		default: ({ text }: { text?: string }) => {
			mockAvatarRender(text);
			return <MockText>{text}</MockText>;
		}
	};
});
jest.mock('../../../../lib/hooks/navigation', () => ({ useAppNavigation: () => ({ goBack: jest.fn() }) }));
jest.mock('../../../../lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => true }));
jest.mock('../../../../lib/hooks/useAppSelector', () => ({
	useAppSelector: jest.fn(() => ({ id: 'user-1', token: 'token-1' }))
}));
jest.mock('../../../../selectors/login', () => ({ getUserSelector: jest.fn() }));
jest.mock('../../hooks/useUnreadsCount', () => ({ useUnreadsCount: () => 0 }));
jest.mock('../../hooks/useGoRoomActionsView', () => ({ useGoRoomActionsView: () => jest.fn() }));
jest.mock('../../../../lib/methods/helpers', () => ({ isGroupChat: jest.fn(() => false) }));
jest.mock('../../../../lib/methods/readMessages', () => ({ readMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../../lib/methods/loadThreadMessages', () => ({ loadThreadMessages: jest.fn(() => Promise.resolve()) }));
jest.mock('../../../../lib/methods/isInviteSubscription', () => ({ isInviteSubscription: jest.fn(() => false) }));
jest.mock('../../../../lib/methods/helpers/log', () => jest.fn());
jest.mock('../../../../lib/services/restApi', () => ({ getUserInfo: jest.fn() }));
jest.mock('../../services/getMessages', () => ({ __esModule: true, default: jest.fn(() => Promise.resolve()) }));
jest.mock('../../services/joinRoom', () => ({ joinRoom: jest.fn(), resumeRoom: jest.fn() }));

const subscription = { id: 'sub-1', rid: 'rid-1', t: 'c', name: 'before', fname: 'before' };

describe('LeftButtons', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the fresh title once when the same Room instance re-emits a renamed row', () => {
		const { emit } = setupObserveRoomDatabase();
		const store = createRoomStore({ rid: 'rid-1', initialRoom: subscription });
		observeRoom('rid-1', store);

		render(<LeftButtons rid='rid-1' roomStore={store} />);
		expect(screen.getByText('before')).toBeTruthy();
		const rendersBeforeRename = mockAvatarRender.mock.calls.length;

		act(() => {
			subscription.name = 'after';
			subscription.fname = 'after';
			emit([subscription]);
		});

		expect(screen.getByText('after')).toBeTruthy();
		expect(mockAvatarRender.mock.calls.length).toBe(rendersBeforeRename + 1);
	});
});
