import { InteractionManager } from 'react-native';
import { renderHook } from '@testing-library/react-native';

import { useRoomStoreForScreen } from '../RoomStore';
import type { IGetOrCreateRoomStoreParams } from '../../../../lib/store/definitions';

export const mountRoomScreenAndCaptureSweeps = (params: IGetOrCreateRoomStoreParams): jest.SpyInstance => {
	const runAfterInteractionsSpy = jest.spyOn(InteractionManager, 'runAfterInteractions').mockImplementation(((cb: () => void) => {
		cb();
		return { then: () => {} };
	}) as unknown as typeof InteractionManager.runAfterInteractions);
	const { unmount } = renderHook(() => useRoomStoreForScreen(params));
	unmount();
	return runAfterInteractionsSpy;
};
