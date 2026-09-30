import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactElement, type ReactNode } from 'react';

import RoomMembersView from './index';
import { mockedStore } from '~/reducers/mockedStore';
import { initStore } from '~/lib/store/auxStore';
import { setUser } from '~/actions/login';
import { selectServerSuccess } from '~/actions/server';
import { type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import { getRoomMembers, getRoomRoles, toggleRoomOwner } from '~/lib/services/restApi';

let mockRouteParams: Record<string, unknown> = {};
const mockShowActionSheet = jest.fn();

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useRoute: () => ({ params: mockRouteParams }),
	useNavigation: () => ({ addListener: jest.fn(() => jest.fn()), setOptions: jest.fn(), navigate: jest.fn() })
}));

jest.mock('~/lib/services/restApi', () => ({
	getRoomMembers: jest.fn(),
	getRoomRoles: jest.fn(),
	toggleRoomOwner: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('~/lib/hooks/usePermissions', () => ({
	usePermissions: () => [false, false, true, false, false]
}));

jest.mock('~/lib/hooks/useMasterDetail', () => ({
	useMasterDetail: () => false
}));

jest.mock('~/containers/ActionSheet', () => ({
	useActionSheet: () => ({ showActionSheet: mockShowActionSheet })
}));

jest.mock('~/containers/Header/components/HeaderButton', () => ({
	Container: () => null,
	Item: () => null
}));

jest.mock('./components/ActionsSection', () => () => null);

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const owner = { _id: 'owner-id', username: 'owner.user', name: 'Owner', roles: ['owner'] };
const member = { _id: 'member-id', username: 'member.user', name: 'Member' };

const setServerVersion = (version: string) =>
	mockedStore.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version, name: 'Open' }));

const openActionSheetFor = async (getByTestId: (id: string) => any, username: string) => {
	const item = await waitFor(() => getByTestId(`room-members-view-item-${username}`));
	fireEvent.press(item);
	const [[{ options }]] = mockShowActionSheet.mock.calls.slice(-1);
	return options as TActionSheetOptionsItem[];
};

const ownerOption = (options: TActionSheetOptionsItem[]) => options.find(option => option.testID === 'action-sheet-set-owner');

const isOwnerChecked = (options: TActionSheetOptionsItem[]) =>
	(ownerOption(options)?.right?.() as ReactElement<{ check: boolean }>).props.check;

describe('RoomMembersView roles', () => {
	beforeAll(() => {
		initStore(mockedStore);
		mockedStore.dispatch(setUser({ id: 'logged-user-id' }));
	});

	beforeEach(() => {
		jest.clearAllMocks();
		mockRouteParams = {
			rid: 'room-id',
			room: { rid: 'room-id', t: 'c', name: 'general' },
			joined: true
		};
		jest.mocked(getRoomMembers).mockResolvedValue([owner, member] as any);
	});

	describe('on servers with rooms.membersOrderedByRole', () => {
		beforeEach(() => setServerVersion('7.3.0'));

		it('shows a header with the loaded count for each role group', async () => {
			const { getByTestId, queryByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });

			const ownersHeader = await waitFor(() => getByTestId('room-members-view-header-owner'));
			expect(ownersHeader).toHaveAccessibleName('Owners, 1');
			expect(getByTestId('room-members-view-header-member')).toHaveAccessibleName('Members, 1');
			expect(queryByTestId('room-members-view-header-leader')).toBeNull();
			expect(queryByTestId('room-members-view-header-moderator')).toBeNull();
		});

		it('does not fetch room roles separately', async () => {
			const { getByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => getByTestId('room-members-view-item-owner.user'));

			expect(getRoomRoles).not.toHaveBeenCalled();
		});

		it('reads the owner checkmark from the member roles', async () => {
			const { getByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });

			const ownerOptions = await openActionSheetFor(getByTestId, 'owner.user');
			expect(isOwnerChecked(ownerOptions)).toBe(true);

			const memberOptions = await openActionSheetFor(getByTestId, 'member.user');
			expect(isOwnerChecked(memberOptions)).toBe(false);
		});

		it('refetches the member list from the first page after a role change', async () => {
			const { getByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			const options = await openActionSheetFor(getByTestId, 'member.user');
			expect(getRoomMembers).toHaveBeenCalledTimes(1);

			await act(() => ownerOption(options)?.onPress?.());

			expect(toggleRoomOwner).toHaveBeenCalledWith({ roomId: 'room-id', t: 'c', userId: 'member-id', isOwner: true });
			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(2));
			expect(getRoomMembers).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 0 }));
			expect(getRoomRoles).not.toHaveBeenCalled();
		});
	});

	describe('on servers older than 7.3.0', () => {
		beforeEach(() => {
			setServerVersion('7.2.0');
			jest.mocked(getRoomRoles).mockResolvedValue({
				success: true,
				roles: [{ _id: 'sub-id', rid: 'room-id', u: { _id: 'member-id', username: 'member.user' }, roles: ['owner'] }]
			} as any);
		});

		it('does not show role headers', async () => {
			const { getByTestId, queryByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => getByTestId('room-members-view-item-owner.user'));

			expect(queryByTestId('room-members-view-header-owner')).toBeNull();
			expect(queryByTestId('room-members-view-header-member')).toBeNull();
		});

		it('reads the owner checkmark from room roles', async () => {
			const { getByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomRoles).toHaveBeenCalledWith('room-id', 'c'));

			const memberOptions = await openActionSheetFor(getByTestId, 'member.user');
			expect(isOwnerChecked(memberOptions)).toBe(true);
		});

		it('refetches room roles and the member list after a role change', async () => {
			const { getByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomRoles).toHaveBeenCalledTimes(1));
			const options = await openActionSheetFor(getByTestId, 'member.user');

			await act(() => ownerOption(options)?.onPress?.());

			await waitFor(() => expect(getRoomRoles).toHaveBeenCalledTimes(2));
			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(2));
		});
	});
});
