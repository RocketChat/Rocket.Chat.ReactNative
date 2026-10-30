import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { type ReactElement, type ReactNode } from 'react';
import { SectionList } from 'react-native';

import RoomMembersView from '../index';
import { mockedStore } from '~/reducers/mockedStore';
import { initStore } from '~/lib/store/auxStore';
import { setUser } from '~/actions/login';
import { addSettings, clearSettings } from '~/actions/settings';
import { selectServerSuccess } from '~/actions/server';
import { type TActionSheetOptionsItem } from '~/containers/ActionSheet';
import UserItem from '~/containers/UserItem';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import { getRoomMembers, getRoomRoles, teamListRoomsOfUser, toggleRoomOwner } from '~/lib/services/restApi';

let mockHasNativeHeaderBar = false;
let mockIsAndroid = false;
let mockPermissions = [false, false, true, false, false, false];
const mockShowActionSheet = jest.fn();
const mockAddListener = jest.fn(() => jest.fn());
const mockSetOptions = jest.fn();

jest.mock('~/lib/methods/helpers/deviceInfo', () =>
	Object.defineProperties(
		{ ...jest.requireActual('~/lib/methods/helpers/deviceInfo') },
		{
			hasNativeHeaderBar: { get: () => mockHasNativeHeaderBar, configurable: true },
			isAndroid: { get: () => mockIsAndroid, configurable: true }
		}
	)
);

jest.mock('@react-navigation/native', () => ({
	...jest.requireActual('@react-navigation/native'),
	useRoute: () => ({ params: { rid: 'room-id', room: { rid: 'room-id', t: 'c', name: 'general' }, joined: true } }),
	useNavigation: () => ({ addListener: mockAddListener, setOptions: mockSetOptions, navigate: jest.fn() })
}));

jest.mock('~/lib/services/restApi', () => ({
	getRoomMembers: jest.fn(),
	getRoomRoles: jest.fn(),
	toggleRoomOwner: jest.fn().mockResolvedValue({ success: true }),
	removeUserFromRoom: jest.fn().mockResolvedValue({ success: true }),
	teamListRoomsOfUser: jest.fn(),
	removeTeamMember: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('~/lib/methods/helpers/info', () => ({
	...jest.requireActual('~/lib/methods/helpers/info'),
	showConfirmationAlert: jest.fn()
}));

jest.mock('~/lib/navigation/appNavigation', () => ({ resetTo: jest.fn(), navigate: jest.fn() }));

jest.mock('~/lib/hooks/usePermissions', () => ({
	usePermissions: () => mockPermissions
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

jest.mock('../components/ActionsSection', () => () => null);

jest.mock('~/containers/NativeListRow/components/Separator', () => {
	const { createElement } = require('react');
	const { View } = require('react-native');
	return { __esModule: true, default: () => createElement(View, { testID: 'row-separator' }) };
});

const Wrapper = ({ children }: { children: ReactNode }) => <Provider store={mockedStore}>{children}</Provider>;

const setUseRealName = (value: boolean) => mockedStore.dispatch(addSettings({ UI_Use_Real_Name: value }));

const setServerVersion = (version: string) =>
	mockedStore.dispatch(selectServerSuccess({ server: 'https://open.rocket.chat', version, name: 'Open' }));

const owner = { _id: 'owner-id', username: 'owner.user', name: 'Owner', roles: ['owner'] };
const member = { _id: 'member-id', username: 'member.user', name: 'Member' };

const openActionSheetFor = async (getByTestId: (id: string) => any, username: string) => {
	const item = await waitFor(() => getByTestId(`room-members-view-item-${username}`));
	fireEvent.press(item);
	const [[{ options }]] = mockShowActionSheet.mock.calls.slice(-1);
	return options as TActionSheetOptionsItem[];
};

const ownerOption = (options: TActionSheetOptionsItem[]) => options.find(option => option.testID === 'action-sheet-set-owner');

const isOwnerChecked = (options: TActionSheetOptionsItem[]) =>
	(ownerOption(options)?.right?.() as ReactElement<{ check: boolean }>).props.check;

beforeAll(() => {
	initStore(mockedStore);
	mockedStore.dispatch(setUser({ id: 'logged-user-id' }));
});

describe('RoomMembersView member names', () => {
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

describe('RoomMembersView roles', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(getRoomMembers).mockResolvedValue([owner, member] as any);
	});

	afterEach(() => {
		mockPermissions = [false, false, true, false, false, false];
		mockIsAndroid = false;
	});

	it.each(['7.4.0', '7.3.0'])('shows No members found for a room without members on server %s', async version => {
		setServerVersion(version);
		jest.mocked(getRoomMembers).mockResolvedValue([]);
		const { findByText } = render(<RoomMembersView />, { wrapper: Wrapper });

		expect(await findByText('No members found')).toBeTruthy();
	});

	describe('on servers with rooms.membersOrderedByRole', () => {
		beforeEach(() => setServerVersion('7.4.0'));

		it('shows a header for each role group', async () => {
			const { getByTestId, queryByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });

			const ownersHeader = await waitFor(() => getByTestId('room-members-view-header-owner'));
			expect(ownersHeader).toHaveAccessibleName('Owners');
			expect(getByTestId('room-members-view-header-member')).toHaveAccessibleName('Members');
			expect(queryByTestId('room-members-view-header-leader')).toBeNull();
			expect(queryByTestId('room-members-view-header-moderator')).toBeNull();
		});

		describe.each([
			{ hasNativeHeaderBar: false, sticky: true },
			{ hasNativeHeaderBar: true, sticky: false }
		])('with hasNativeHeaderBar $hasNativeHeaderBar', ({ hasNativeHeaderBar, sticky }) => {
			beforeEach(() => {
				mockHasNativeHeaderBar = hasNativeHeaderBar;
			});

			afterEach(() => {
				mockHasNativeHeaderBar = false;
			});

			it(`${sticky ? 'sticks' : 'does not stick'} the role headers`, async () => {
				const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });

				await waitFor(() => getByTestId('room-members-view-header-owner'));
				expect(UNSAFE_getByType(SectionList).props.stickySectionHeadersEnabled).toBe(sticky);
			});
		});

		it('draws a separator between members of the same group only', async () => {
			jest
				.mocked(getRoomMembers)
				.mockResolvedValue([owner, member, { ...member, _id: 'member-2-id', username: 'member2.user' }] as any);
			const { getByTestId, getAllByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });

			await waitFor(() => getByTestId('room-members-view-item-member2.user'));
			expect(getAllByTestId('row-separator')).toHaveLength(1);
		});

		it('marks the first and last row of each role group', async () => {
			jest
				.mocked(getRoomMembers)
				.mockResolvedValue([owner, member, { ...member, _id: 'member-2-id', username: 'member2.user' }] as any);
			const { getByTestId, UNSAFE_getAllByType } = render(<RoomMembersView />, { wrapper: Wrapper });

			await waitFor(() => getByTestId('room-members-view-item-member2.user'));

			expect(UNSAFE_getAllByType(UserItem).map(({ props }) => [props.username, props.isFirst, props.isLast])).toEqual([
				['owner.user', true, true],
				['member.user', true, false],
				['member2.user', false, true]
			]);
		});

		it('shows no members found instead of a blank list when the ordered endpoint fails', async () => {
			jest.mocked(getRoomMembers).mockResolvedValue(undefined as any);
			const { queryByTestId, findByText } = render(<RoomMembersView />, { wrapper: Wrapper });

			expect(await findByText('No members found')).toBeTruthy();
			expect(queryByTestId('room-members-view-header-owner')).toBeNull();
			expect(queryByTestId('room-members-view-header-member')).toBeNull();
		});

		it.each([
			['rejects', () => jest.mocked(getRoomMembers).mockRejectedValue(new Error('network'))],
			['returns nothing', () => jest.mocked(getRoomMembers).mockResolvedValue(undefined as any)]
		])('does not request the page again when the request %s', async (_, failRequest) => {
			failRequest();
			const { UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(1));

			await act(async () => UNSAFE_getByType(SectionList).props.onEndReached());

			expect(getRoomMembers).toHaveBeenCalledTimes(1);
		});

		it('requests the next page again after the screen is focused following a failed request', async () => {
			jest
				.mocked(getRoomMembers)
				.mockResolvedValueOnce(undefined as any)
				.mockResolvedValueOnce(
					Array.from({ length: 25 }, (_, index) => ({ _id: `id-${index}`, username: `user${index}` })) as any
				);
			const { UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(1));

			const [, onFocus] = mockAddListener.mock.calls.find(([event]: any[]) => event === 'focus') as any[];
			await act(async () => onFocus());
			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(2));
			await act(async () => UNSAFE_getByType(SectionList).props.onEndReached());

			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(3));
		});

		it('shows Try again after a next page fails and requests that page again when pressed', async () => {
			jest
				.mocked(getRoomMembers)
				.mockResolvedValueOnce(
					Array.from({ length: 25 }, (_, index) => ({ _id: `id-${index}`, username: `user${index}` })) as any
				)
				.mockResolvedValueOnce(undefined as any)
				.mockResolvedValueOnce([{ _id: 'id-25', username: 'user25' }] as any);
			const { UNSAFE_getByType, findByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(1));
			await act(async () => UNSAFE_getByType(SectionList).props.onEndReached());

			fireEvent.press(await findByTestId('room-members-view-retry'));

			await waitFor(() =>
				expect(
					UNSAFE_getByType(SectionList).props.sections.flatMap((section: any) => section.data.map((item: any) => item._id))
				).toContain('id-25')
			);
			expect(getRoomMembers).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 25 }));
		});

		it('does not request the members again when the screen is focused with the list loaded', async () => {
			const { findByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await findByTestId('room-members-view-item-owner.user');

			const [, onFocus] = mockAddListener.mock.calls.find(([event]: any[]) => event === 'focus') as any[];
			await act(async () => onFocus());

			expect(getRoomMembers).toHaveBeenCalledTimes(1);
		});

		it('shows only the members of the status selected while the previous status was still loading', async () => {
			let resolveAllMembers: (members: unknown[]) => void = () => {};
			jest
				.mocked(getRoomMembers)
				.mockReturnValueOnce(new Promise(resolve => (resolveAllMembers = resolve)) as any)
				.mockResolvedValueOnce([member] as any);
			const { findByTestId, queryByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(1));

			const [{ headerRight }] = mockSetOptions.mock.lastCall;
			await act(async () => headerRight().props.actions[0].menu[0].onPress());
			await findByTestId('room-members-view-item-member.user');
			await act(async () => resolveAllMembers([owner]));

			expect(queryByTestId('room-members-view-item-owner.user')).toBeNull();
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

		it('moves the member under the new role header after a role change without refetching', async () => {
			const { getByTestId, queryByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			const options = await openActionSheetFor(getByTestId, 'member.user');

			await act(() => ownerOption(options)?.onPress?.());

			expect(toggleRoomOwner).toHaveBeenCalledWith({ roomId: 'room-id', t: 'c', userId: 'member-id', isOwner: true });
			await waitFor(() => expect(queryByTestId('room-members-view-header-member')).toBeNull());
			expect(getByTestId('room-members-view-item-member.user')).toBeTruthy();
			expect(getRoomMembers).toHaveBeenCalledTimes(1);
			expect(getRoomRoles).not.toHaveBeenCalled();
			expect(isOwnerChecked(await openActionSheetFor(getByTestId, 'member.user'))).toBe(true);
		});

		describe('with a second page', () => {
			type TSection = { key?: string; data: { _id: string; roles?: string[] }[] };
			const firstPage = Array.from({ length: 25 }, (_, index) => ({ _id: `id-${index}`, username: `user${index}` }));
			const nextPage = [{ _id: 'id-25', username: 'user25' }];

			const memberIds = (sections: TSection[]) => sections.flatMap(section => section.data.map(item => item._id));

			const expectUser3PromotedAmong26 = (sections: TSection[]) => {
				expect(sections.map(section => [section.key, section.data.length])).toEqual([
					['owner', 1],
					['member', 25]
				]);
				expect(sections[0].data[0]).toEqual(expect.objectContaining({ _id: 'id-3', roles: ['owner'] }));
			};

			it('keeps the role change when the next page loads afterwards', async () => {
				jest
					.mocked(getRoomMembers)
					.mockResolvedValueOnce(firstPage as any)
					.mockResolvedValueOnce(nextPage as any);
				const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
				const options = await openActionSheetFor(getByTestId, 'user3');
				await act(() => ownerOption(options)?.onPress?.());
				await waitFor(() => expect(getByTestId('room-members-view-header-owner')).toBeTruthy());

				await act(async () => UNSAFE_getByType(SectionList).props.onEndReached());

				await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(2));
				await waitFor(() => expectUser3PromotedAmong26(UNSAFE_getByType(SectionList).props.sections));
			});

			it.each([
				['room', 4, 'action-sheet-remove-from-room'],
				['team', 5, 'action-sheet-remove-from-team']
			])('keeps a page that loads while the remove from %s confirmation is open', async (_, permissionIndex, testID) => {
				mockPermissions = mockPermissions.map((allowed, index) => allowed || index === permissionIndex);
				jest.mocked(teamListRoomsOfUser).mockResolvedValue({ success: true, rooms: [] } as any);
				jest
					.mocked(getRoomMembers)
					.mockResolvedValueOnce(firstPage as any)
					.mockResolvedValueOnce(nextPage as any);
				const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
				const options = await openActionSheetFor(getByTestId, 'user3');
				await act(async () => options.find(option => option.testID === testID)?.onPress?.());
				await waitFor(() => expect(showConfirmationAlert).toHaveBeenCalledTimes(1));

				await act(async () => UNSAFE_getByType(SectionList).props.onEndReached());
				await waitFor(() => expect(memberIds(UNSAFE_getByType(SectionList).props.sections)).toHaveLength(26));
				await act(async () => jest.mocked(showConfirmationAlert).mock.calls[0][0].onPress());

				await waitFor(() => expect(memberIds(UNSAFE_getByType(SectionList).props.sections)).toHaveLength(25));
				expect(memberIds(UNSAFE_getByType(SectionList).props.sections)).toContain('id-25');
				expect(memberIds(UNSAFE_getByType(SectionList).props.sections)).not.toContain('id-3');
			});

			describe('when a loaded member moves later in the server order', () => {
				const ownerFirstPage = firstPage.map(item => (item._id === 'id-3' ? { ...item, roles: ['owner'] } : item));
				const fullNextPage = Array.from({ length: 25 }, (_, index) => ({
					_id: `id-${25 + index}`,
					username: `user${25 + index}`
				}));

				const loadFirstPageAndRequestNext = async (removeUser: (options: TActionSheetOptionsItem[]) => Promise<void>) => {
					jest
						.mocked(getRoomMembers)
						.mockResolvedValueOnce(ownerFirstPage as any)
						.mockResolvedValueOnce(fullNextPage as any)
						.mockResolvedValue([] as any);
					const view = render(<RoomMembersView />, { wrapper: Wrapper });
					await removeUser(await openActionSheetFor(view.getByTestId, 'user3'));
					await act(async () => view.UNSAFE_getByType(SectionList).props.onEndReached());
					await waitFor(() => expect(getRoomMembers).toHaveBeenCalledTimes(2));
					return view;
				};

				it('requests the next page one row earlier after an owner is demoted', async () => {
					await loadFirstPageAndRequestNext(async options => {
						await act(() => ownerOption(options)?.onPress?.());
					});

					expect(getRoomMembers).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 24 }));
				});

				it.each([
					['room', 4, 'action-sheet-remove-from-room'],
					['team', 5, 'action-sheet-remove-from-team']
				])('requests the next page one row earlier after a member is removed from the %s', async (_, permissionIndex, testID) => {
					mockPermissions = mockPermissions.map((allowed, index) => allowed || index === permissionIndex);
					jest.mocked(teamListRoomsOfUser).mockResolvedValue({ success: true, rooms: [] } as any);
					await loadFirstPageAndRequestNext(async options => {
						await act(async () => options.find(option => option.testID === testID)?.onPress?.());
						await act(async () => jest.mocked(showConfirmationAlert).mock.calls[0][0].onPress());
					});

					expect(getRoomMembers).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 24 }));
				});

				it('keeps the shift for the pages after it', async () => {
					const { UNSAFE_getByType } = await loadFirstPageAndRequestNext(async options => {
						await act(() => ownerOption(options)?.onPress?.());
					});
					await waitFor(() => expect(memberIds(UNSAFE_getByType(SectionList).props.sections)).toContain('id-25'));

					await act(async () => UNSAFE_getByType(SectionList).props.onEndReached());

					expect(getRoomMembers).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 49 }));
				});
			});

			it('keeps the role change when the next page was already loading', async () => {
				let resolveNextPage!: (members: unknown) => void;
				jest
					.mocked(getRoomMembers)
					.mockResolvedValueOnce(firstPage as any)
					.mockReturnValueOnce(new Promise(resolve => (resolveNextPage = resolve)) as any);
				const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
				await waitFor(() => getByTestId('room-members-view-item-user0'));
				await act(async () => {
					UNSAFE_getByType(SectionList).props.onEndReached();
				});
				const options = await openActionSheetFor(getByTestId, 'user3');
				await act(() => ownerOption(options)?.onPress?.());

				await act(async () => resolveNextPage(nextPage));

				await waitFor(() => expectUser3PromotedAmong26(UNSAFE_getByType(SectionList).props.sections));
			});
		});

		it('keeps the member where it was when the role change fails', async () => {
			jest.mocked(toggleRoomOwner).mockRejectedValueOnce(new Error('error-you-are-last-owner'));
			const { getByTestId, queryByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			const options = await openActionSheetFor(getByTestId, 'member.user');

			await act(() => ownerOption(options)?.onPress?.());

			expect(toggleRoomOwner).toHaveBeenCalledTimes(1);
			expect(queryByTestId('room-members-view-header-member')).toBeTruthy();
			expect(isOwnerChecked(await openActionSheetFor(getByTestId, 'member.user'))).toBe(false);
		});

		it('turns off clipped subviews on Android for the sticky role headers', async () => {
			mockIsAndroid = true;
			const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => getByTestId('room-members-view-header-owner'));

			expect(UNSAFE_getByType(SectionList).props.removeClippedSubviews).toBe(false);
		});

		it('appends the next page without repeating members already loaded', async () => {
			const firstPage = Array.from({ length: 25 }, (_, index) => ({ _id: `id-${index}`, username: `user${index}` }));
			const nextPage = [firstPage[24], { _id: 'id-25', username: 'user25' }];
			jest
				.mocked(getRoomMembers)
				.mockResolvedValueOnce(firstPage as any)
				.mockResolvedValueOnce(nextPage as any);
			const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => getByTestId('room-members-view-item-user0'));

			await act(async () => UNSAFE_getByType(SectionList).props.onEndReached());

			expect(getRoomMembers).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 25 }));
			await waitFor(() => {
				const sections: { data: { _id: string }[] }[] = UNSAFE_getByType(SectionList).props.sections;
				expect(sections.flatMap(section => section.data.map(item => item._id))).toEqual([
					...firstPage.map(member => member._id),
					'id-25'
				]);
			});
		});
	});

	describe('on servers older than 7.4.0', () => {
		beforeEach(() => {
			setServerVersion('7.3.0');
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

		it('does not stick section headers when there are no role headers', async () => {
			const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => getByTestId('room-members-view-item-owner.user'));

			expect(UNSAFE_getByType(SectionList).props.stickySectionHeadersEnabled).toBe(false);
		});

		it('reads the owner checkmark from room roles', async () => {
			const { getByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomRoles).toHaveBeenCalledWith('room-id', 'c'));

			const memberOptions = await openActionSheetFor(getByTestId, 'member.user');
			expect(isOwnerChecked(memberOptions)).toBe(true);
		});

		it('clips off-screen rows on Android, as FlatList does by default', async () => {
			mockIsAndroid = true;
			const { getByTestId, UNSAFE_getByType } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => getByTestId('room-members-view-item-owner.user'));

			expect(UNSAFE_getByType(SectionList).props.removeClippedSubviews).toBe(true);
		});

		it('refetches only the room roles after a role change', async () => {
			const { getByTestId } = render(<RoomMembersView />, { wrapper: Wrapper });
			await waitFor(() => expect(getRoomRoles).toHaveBeenCalledTimes(1));
			const options = await openActionSheetFor(getByTestId, 'member.user');

			await act(() => ownerOption(options)?.onPress?.());

			await waitFor(() => expect(getRoomRoles).toHaveBeenCalledTimes(2));
			expect(getRoomMembers).toHaveBeenCalledTimes(1);
		});
	});
});
