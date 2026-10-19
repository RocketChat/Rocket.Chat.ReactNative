import { renderHook } from '@testing-library/react-native';
import { type ReactElement } from 'react';

import { RoomsSearchContext } from '../../contexts/RoomsSearchProvider';
import { useShowsNewMessageButton } from '../useShowsNewMessageButton';

let mockRouteName = 'RoomsListView';
jest.mock('@react-navigation/native', () => ({ useRoute: () => ({ name: mockRouteName }) }));

let mockHasNativeHeaderBar = true;
jest.mock('~/lib/methods/helpers', () => Object.defineProperty({}, 'hasNativeHeaderBar', { get: () => mockHasNativeHeaderBar }));

let mockIsMasterDetail = false;
jest.mock('~/lib/hooks/useMasterDetail', () => ({ useMasterDetail: () => mockIsMasterDetail }));

let mockCanCreateRoom = true;
jest.mock('../useNewMessage', () => ({ useCanCreateRoom: () => mockCanCreateRoom }));

const renderUseShowsNewMessageButton = ({ searchEnabled = false } = {}) => {
	const wrapper = ({ children }: { children: ReactElement }) => (
		<RoomsSearchContext.Provider value={{ searchEnabled } as never}>{children}</RoomsSearchContext.Provider>
	);
	return renderHook(useShowsNewMessageButton, { wrapper }).result.current;
};

describe('useShowsNewMessageButton', () => {
	beforeEach(() => {
		mockRouteName = 'RoomsListView';
		mockHasNativeHeaderBar = true;
		mockIsMasterDetail = false;
		mockCanCreateRoom = true;
	});

	it('shows on the phone chats tab', () => {
		expect(renderUseShowsNewMessageButton()).toBe(true);
	});

	it('shows on the phone direct messages tab', () => {
		mockRouteName = 'DirectMessagesView';
		expect(renderUseShowsNewMessageButton()).toBe(true);
	});

	it('hides on the search tab', () => {
		mockRouteName = 'RoomsSearchView';
		expect(renderUseShowsNewMessageButton()).toBe(false);
	});

	it('hides while searching', () => {
		expect(renderUseShowsNewMessageButton({ searchEnabled: true })).toBe(false);
	});

	it('hides without permission to create rooms', () => {
		mockCanCreateRoom = false;
		expect(renderUseShowsNewMessageButton()).toBe(false);
	});

	it('hides on master detail when the native header has the create action', () => {
		mockIsMasterDetail = true;
		expect(renderUseShowsNewMessageButton()).toBe(false);
	});

	it('shows on master detail when the JS header has no create action', () => {
		mockIsMasterDetail = true;
		mockHasNativeHeaderBar = false;
		expect(renderUseShowsNewMessageButton()).toBe(true);
	});
});
