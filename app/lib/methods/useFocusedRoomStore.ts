import { create } from 'zustand';

interface IFocusedRoomStore {
	rid: string | null;
}

export const useFocusedRoomStore = create<IFocusedRoomStore>(() => ({ rid: null }));

export const focusRoom = (rid: string) => useFocusedRoomStore.setState({ rid });

export const blurRoom = (rid: string) => {
	if (useFocusedRoomStore.getState().rid === rid) {
		useFocusedRoomStore.setState({ rid: null });
	}
};
