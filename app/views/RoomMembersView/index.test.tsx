import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactNode } from 'react';

import RoomMembersView from './index';
import { mockedStore } from '~/reducers/mockedStore';
import { initStore } from '~/lib/store/auxStore';
import { setUser } from '~/actions/login';
import { addSettings, clearSettings } from '~/actions/settings';
import { getRoomMembers } from '~/lib/services/restApi';

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useRoute: () => ({ params: { rid: 'room-id', room: { rid: 'room-id', t: 'c', name: 'general' }, joined: true } }),
	useNavigation: () => ({ addListener: jest.fn(() => jest.fn()), setOptions: jest.fn(), navigate: jest.fn() })
}));

jest.mock('~/lib/services/restApi', () => ({
	getRoomMembers: jest.fn(),
	getRoomRoles: jest.fn()
}));

jest.mock('~/lib/hooks/usePermissions', () => ({
	usePermissions: () => [false, false, false, false, false]
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

jest.mock('~/containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: jest.fn() })
}));

jest.mock('~/containers/Header/components/HeaderButton', () => ({
	Container: () => null,
	Item: () => null
}));

jest.mock('./components/ActionsSection', () => () => null);

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const setUseRealName = (value: boolean) => mockedStore.dispatch(addSettings({ UI_Use_Real_Name: value }));

describe('RoomMembersView member names', () => {
	beforeAll(() => {
		initStore(mockedStore);
		mockedStore.dispatch(setUser({ id: 'logged-user-id' }));
	});

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(getRoomMembers).mockResolvedValue([
			{ _id: 'owner-id', username: 'rt.owner', name: 'RT Owner' },
			{ _id: 'no-name-id', username: 'rt.no.name' }
		] as any);
	});

	it('shows usernames when UI_Use_Real_Name is disabled', async () => {
		setUseRealName(false);
		const { findByText, queryByText } = render(<RoomMembersView />, { wrapper: Wrapper });

		expect(await findByText('rt.owner')).toBeTruthy();
		expect(queryByText('RT Owner')).toBeNull();
	});

	it('shows real names when UI_Use_Real_Name is enabled', async () => {
		setUseRealName(true);
		const { findByText, queryByText } = render(<RoomMembersView />, { wrapper: Wrapper });

		expect(await findByText('RT Owner')).toBeTruthy();
		expect(queryByText('rt.owner')).toBeNull();
	});

	it('falls back to the username when the member has no real name', async () => {
		setUseRealName(true);
		const { findByText } = render(<RoomMembersView />, { wrapper: Wrapper });

		expect(await findByText('rt.no.name')).toBeTruthy();
	});

	it('falls back to the real name when the member has no username', async () => {
		setUseRealName(false);
		jest.mocked(getRoomMembers).mockResolvedValue([{ _id: 'no-username-id', name: 'RT No Username' }] as any);
		const { findByText } = render(<RoomMembersView />, { wrapper: Wrapper });

		expect(await findByText('RT No Username')).toBeTruthy();
	});

	it.each([true, false])(
		'falls back to the user id when the member has neither name nor username (UI_Use_Real_Name %s)',
		async value => {
			setUseRealName(value);
			jest.mocked(getRoomMembers).mockResolvedValue([{ _id: 'anonymous-id' }] as any);
			const { findByText } = render(<RoomMembersView />, { wrapper: Wrapper });

			expect(await findByText('anonymous-id')).toBeTruthy();
		}
	);

	it('shows usernames before settings are loaded', async () => {
		mockedStore.dispatch(clearSettings());
		const { findByText, queryByText } = render(<RoomMembersView />, { wrapper: Wrapper });

		expect(await findByText('rt.owner')).toBeTruthy();
		expect(queryByText('RT Owner')).toBeNull();
	});
});
