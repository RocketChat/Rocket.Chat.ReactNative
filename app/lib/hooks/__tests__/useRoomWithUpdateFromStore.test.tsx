import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type TRoomOrPreview } from '../../../definitions/TRoom';
import { useRoomWithUpdateFromStore, type IRoomWithUpdateState } from '../useRoomWithUpdateFromStore';

describe('useRoomWithUpdateFromStore', () => {
	it('re-renders when an observed room mutates in place and receives a new patch', () => {
		const room: TRoomOrPreview = { rid: 'rid-1', t: 'c', name: 'old' };
		const store = createStore<IRoomWithUpdateState>()(() => ({ room, roomUpdate: {} }));
		let renders = 0;
		const { result } = renderHook(() => {
			renders += 1;
			return useRoomWithUpdateFromStore(store);
		});

		act(() => {
			room.name = 'new';
			store.setState({ roomUpdate: { name: 'new' } });
		});

		expect(result.current).toBe(room);
		expect(result.current.name).toBe('new');
		expect(renders).toBe(2);
	});
});
