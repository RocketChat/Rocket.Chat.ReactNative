import { renderHook } from '@testing-library/react-native';

import { useRoomTypeFilter } from '../useRoomTypeFilter';

const mockRoute = { name: 'RoomsListView' };
let mockIsMasterDetail = false;

jest.mock('@react-navigation/native', () => ({ useRoute: () => mockRoute }));
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => mockIsMasterDetail }));

describe('useRoomTypeFilter', () => {
	beforeEach(() => {
		mockIsMasterDetail = false;
	});

	it('leaves direct messages out of the phone chats tab', () => {
		mockRoute.name = 'RoomsListView';
		expect(renderHook(useRoomTypeFilter).result.current).toBe('withoutDirectMessages');
	});

	it('keeps every room type in the tablet rooms list', () => {
		mockRoute.name = 'RoomsListView';
		mockIsMasterDetail = true;
		expect(renderHook(useRoomTypeFilter).result.current).toBe('all');
	});

	it('shows only direct messages on the direct messages tab', () => {
		mockRoute.name = 'DirectMessagesView';
		expect(renderHook(useRoomTypeFilter).result.current).toBe('directMessages');
	});

	it('keeps every room type in the search tab', () => {
		mockRoute.name = 'RoomsSearchView';
		expect(renderHook(useRoomTypeFilter).result.current).toBe('all');
	});
});
