import { act, renderHook } from '@testing-library/react-native';
import { createStore } from 'zustand';

import { type TRoomOrPreview } from '../../../definitions/TRoom';
import { useRoomReadFromStore, type IRoomReadState } from '../useRoomReadFromStore';

describe('useRoomReadFromStore', () => {
	it('re-renders when an observed room mutates in place and receives a new read', () => {
		const room: TRoomOrPreview = { rid: 'rid-1', t: 'c', name: 'old' };
		const store = createStore<IRoomReadState>()(() => ({ room: { room } }));
		let renders = 0;
		const { result } = renderHook(() => {
			renders += 1;
			return useRoomReadFromStore(store);
		});

		act(() => {
			room.name = 'new';
			store.setState({ room: { room } });
		});

		expect(result.current.room).toBe(room);
		expect(result.current.room.name).toBe('new');
		expect(renders).toBe(2);
	});
});
