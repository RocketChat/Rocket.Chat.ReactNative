import { goRoom } from '../../methods/helpers/goRoom';
import { store } from '../../store/auxStore';
import { useCallStore } from './useCallStore';
import { navigateToCallRoom } from './navigateToCallRoom';
import { SubscriptionType } from '../../../definitions';

jest.mock('./useCallStore', () => ({
	useCallStore: {
		getState: jest.fn()
	}
}));

jest.mock('../../methods/helpers/goRoom', () => ({
	goRoom: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../store/auxStore', () => ({
	store: {
		getState: jest.fn()
	}
}));

const mockGetState = jest.mocked(useCallStore.getState);
const mockGoRoom = jest.mocked(goRoom);
const mockStoreGetState = jest.mocked(store.getState);

describe('navigateToCallRoom', () => {
	const toggleFocus = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		mockStoreGetState.mockReturnValue({ app: { isMasterDetail: true } } as ReturnType<typeof store.getState>);
	});

	it('does not navigate when roomId is null', async () => {
		mockGetState.mockReturnValue({
			roomId: null,
			contact: { username: 'u', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockGoRoom).not.toHaveBeenCalled();
		expect(toggleFocus).not.toHaveBeenCalled();
	});

	it('does not navigate for SIP contact', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'u', sipExtension: '100' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockGoRoom).not.toHaveBeenCalled();
	});

	it('does not navigate when username is missing', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: undefined, sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(mockGoRoom).not.toHaveBeenCalled();
	});

	it('minimizes first when CallView is focused then navigates', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: true,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(toggleFocus).toHaveBeenCalledTimes(1);
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
	});

	it('navigates without toggleFocus when already minimized', async () => {
		mockGetState.mockReturnValue({
			roomId: 'rid-1',
			contact: { username: 'alice', sipExtension: '' },
			focused: false,
			toggleFocus
		} as ReturnType<typeof useCallStore.getState>);

		await navigateToCallRoom();

		expect(toggleFocus).not.toHaveBeenCalled();
		expect(mockGoRoom).toHaveBeenCalledWith({
			item: { rid: 'rid-1', name: 'alice', t: SubscriptionType.DIRECT },
			isMasterDetail: true
		});
	});
});
