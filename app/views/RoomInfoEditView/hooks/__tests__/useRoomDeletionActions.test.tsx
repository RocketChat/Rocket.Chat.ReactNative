import { renderHook } from '@testing-library/react-native';

import useRoomDeletionActions from '../useRoomDeletionActions';
import { showConfirmationAlert } from '~/lib/methods/helpers';
import { type ISubscription } from '~/definitions';

const mockDispatch = jest.fn();
const mockFetch = jest.fn();

jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock('~/lib/database', () => ({
	active: { get: () => ({ query: () => ({ fetch: mockFetch }) }) }
}));
jest.mock('~/lib/methods/helpers', () => ({
	getRoomTitle: jest.fn(() => 'Team'),
	showConfirmationAlert: jest.fn(),
	showErrorAlert: jest.fn()
}));
jest.mock('~/lib/methods/helpers/log', () => ({ __esModule: true, default: jest.fn() }));

const team = { rid: 'team-rid', t: 'c', teamId: 'team-id', teamMain: true } as ISubscription;
const publicChannel = { rid: 'channel-rid', t: 'c' };
const privateGroup = { rid: 'group-rid', t: 'p' };

const renderDeletionActions = ({ deleteCPermission = true, deletePPermission = true } = {}) => {
	const navigation = { navigate: jest.fn() };
	const { result } = renderHook(() =>
		useRoomDeletionActions({ navigation: navigation as any, room: team, deleteCPermission, deletePPermission })
	);
	return { navigation, deleteTeam: result.current.deleteTeam };
};

const confirm = () => (showConfirmationAlert as jest.Mock).mock.calls[0][0].onPress();

describe('useRoomDeletionActions', () => {
	beforeEach(() => jest.clearAllMocks());

	it('offers every team channel the user can delete, then deletes the team with the picked ones', async () => {
		mockFetch.mockResolvedValue([publicChannel, privateGroup]);
		const { navigation, deleteTeam } = renderDeletionActions({ deletePPermission: false });

		await deleteTeam();

		const { data, nextAction } = navigation.navigate.mock.calls[0][1];
		expect(data).toEqual([publicChannel]);

		nextAction(['channel-rid']);
		confirm();

		expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ scope: 'team', room: team, selected: ['channel-rid'] }));
	});

	it('deletes the team directly when the user can delete none of its channels', async () => {
		mockFetch.mockResolvedValue([publicChannel, privateGroup]);
		const { navigation, deleteTeam } = renderDeletionActions({ deleteCPermission: false, deletePPermission: false });

		await deleteTeam();
		confirm();

		expect(navigation.navigate).not.toHaveBeenCalled();
		expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ scope: 'team', room: team }));
	});
});
