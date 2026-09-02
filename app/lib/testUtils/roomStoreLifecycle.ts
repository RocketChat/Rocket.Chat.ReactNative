import { InteractionManager } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import { useRoomStoreForScreen } from '../../views/RoomView/stores/RoomStore';
import type { IGetOrCreateRoomStoreParams } from '../store/definitions';

export const mountAndReleaseRoomStore = (params: IGetOrCreateRoomStoreParams): jest.SpyInstance => {
	const { unmount } = renderHook(() => useRoomStoreForScreen(params));
	const runAfterInteractionsSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((cb: () => void) => {
		cb();
		return { then: () => {} };
	}) as unknown as typeof InteractionManager.runAfterInteractions);
	unmount();
	return runAfterInteractionsSpy;
};
