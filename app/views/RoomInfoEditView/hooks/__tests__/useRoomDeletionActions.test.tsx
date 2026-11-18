import { renderHook } from '@testing-library/react-native';

import useRoomDeletionActions from '../useRoomDeletionActions';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import { type ISubscription } from '~/definitions/ISubscription';

const mockDispatch = jest.fn();
const mockFetch = jest.fn();
let mockDeletableRids: string[] = [];

jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock('~/lib/database', () => ({
	active: { get: () => ({ query: () => ({ fetch: mockFetch }) }) }
}));
jest.mock('~/lib/methods/helpers/getRoomTitle', () => ({
	getRoomTitle: jest.fn(() => 'Team')
}));
jest.mock('~/lib/methods/helpers/info', () => ({
	showConfirmationAlert: jest.fn(),
	showErrorAlert: jest.fn()
}));
jest.mock('~/lib/methods/canDeleteTeamChannel', () => ({
	canDeleteTeamChannel: jest.fn(({ rid }: { rid: string }, teamRoomId: string) =>
		Promise.resolve(teamRoomId === 'team-rid' && mockDeletableRids.includes(rid))
	)
}));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const team = { rid: 'team-rid', t: 'c', teamId: 'team-id', teamMain: true } as ISubscription;
const publicChannel = { rid: 'channel-rid', name: 'channel', t: 'c', alert: true };
const privateGroup = { rid: 'group-rid', name: 'group', t: 'p', alert: false };

const renderDeletionActions = () => {
	const navigation = { navigate: jest.fn() };
	const { result } = renderHook(() => useRoomDeletionActions({ navigation: navigation as any, room: team }));
	return { navigation, deleteTeam: result.current.deleteTeam };
};

const confirm = () => (showConfirmationAlert as jest.Mock).mock.calls[0][0].onPress();

describe('useRoomDeletionActions', () => {
	beforeEach(() => jest.clearAllMocks());

	it('offers the team channels the user can delete, then deletes the team with the picked ones', async () => {
		mockFetch.mockResolvedValue([publicChannel, privateGroup]);
		mockDeletableRids = ['channel-rid'];
		const { navigation, deleteTeam } = renderDeletionActions();

		await deleteTeam();

		const { data, nextAction } = navigation.navigate.mock.calls[0][1];
		expect(data).toEqual([{ rid: 'channel-rid', name: 'channel', t: 'c' }]);

		nextAction(['channel-rid']);
		confirm();

		expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ room: team, selected: ['channel-rid'] }));
	});

	it('deletes the team directly when the user can delete none of its channels', async () => {
		mockFetch.mockResolvedValue([publicChannel, privateGroup]);
		mockDeletableRids = [];
		const { navigation, deleteTeam } = renderDeletionActions();

		await deleteTeam();
		confirm();

		expect(navigation.navigate).not.toHaveBeenCalled();
		expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ room: team }));
	});
});
