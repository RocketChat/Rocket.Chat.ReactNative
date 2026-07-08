import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';

import RoomInfoView from './index';
import { mockedStore } from '../../reducers/mockedStore';
import { initStore } from '../../lib/store/auxStore';
import { setUser } from '../../actions/login';
import { getUserInfo, toggleBlockUser } from '../../lib/services/restApi';

let mockRouteParams: Record<string, unknown> = {};
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useRoute: () => ({ params: mockRouteParams }),
	useNavigation: () => ({ addListener: jest.fn(() => jest.fn()), setOptions: jest.fn(), navigate: mockNavigate })
}));

jest.mock('../../lib/database/services/Subscription', () => ({
	getSubscriptionByRoomId: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../lib/methods/helpers', () => ({
	...jest.requireActual('../../lib/methods/helpers'),
	hasPermission: jest.fn().mockResolvedValue([false])
}));

jest.mock('../../lib/services/restApi', () => ({
	getUserInfo: jest.fn(() => new Promise(() => {})),
	getRoomInfo: jest.fn(),
	getVisitorInfo: jest.fn(),
	toggleBlockUser: jest.fn().mockResolvedValue(true),
	ignoreUser: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../lib/methods/createDirectMessage', () => ({
	createDirectMessage: jest.fn()
}));

jest.mock('../../lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

jest.mock('../../lib/hooks/useVideoConf', () => ({
	useVideoConf: () => ({ callEnabled: false, disabledTooltip: false, showInitCallActionSheet: jest.fn() })
}));

jest.mock('../../lib/hooks/useNewMediaCall', () => ({
	useNewMediaCall: () => ({ openNewMediaCall: jest.fn(), hasMediaCallPermission: false, isInActiveCall: false })
}));

jest.mock('../../lib/services/voip/isInActiveVoipCall', () => ({
	useIsInActiveVoipCall: () => false
}));

jest.mock('./hooks', () => ({
	useE2EEWarning: () => false
}));

jest.mock('../../containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: jest.fn() })
}));

jest.mock('../../containers/Header/components/HeaderButton', () => ({
	Container: () => null,
	Item: () => null,
	CloseModal: () => null
}));

jest.mock('./components/RoomInfoViewAvatar', () => () => null);
jest.mock('./components/RoomInfoViewTitle', () => () => null);
jest.mock('./components/RoomInfoViewBody', () => () => null);

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const dmRoom = {
	rid: 'dm-rid',
	t: 'd',
	uids: ['logged-user-id', 'other-user-id'],
	usernames: ['me.user', 'other.user'],
	name: 'other.user',
	blocker: false
};

describe('RoomInfoView block/ignore user', () => {
	beforeAll(() => {
		initStore(mockedStore);
		mockedStore.dispatch(setUser({ id: 'logged-user-id' }));
	});

	beforeEach(() => {
		jest.clearAllMocks();
		// member arrives from RoomActionsView possibly without _id (its own fetch may not have resolved yet)
		mockRouteParams = {
			rid: 'dm-rid',
			t: 'd',
			fromRid: 'dm-rid',
			room: dmRoom,
			member: { username: 'other.user', status: 'online' }
		};
	});

	it('blocks the DM user even when member param has no _id yet', async () => {
		const { getByText } = render(<RoomInfoView />, { wrapper: Wrapper });
		const blockButton = await waitFor(() => getByText('Block'));
		fireEvent.press(blockButton);
		await waitFor(() => expect(toggleBlockUser).toHaveBeenCalled());
		expect(toggleBlockUser).toHaveBeenCalledWith('dm-rid', 'other-user-id', true);
	});

	it('fetches full user info when member param has no _id', async () => {
		render(<RoomInfoView />, { wrapper: Wrapper });
		await waitFor(() => expect(getUserInfo).toHaveBeenCalledWith('other-user-id'));
	});
});
