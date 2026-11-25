import { create } from 'zustand';

export interface IRoomScreen {
	rid: string;
	tmid?: string;
}

interface IFocusedRoomStore {
	screen: IRoomScreen | null;
}

export const useFocusedRoomStore = create<IFocusedRoomStore>(() => ({ screen: null }));

export const isSameRoomScreen = (screen: IRoomScreen | null, other: IRoomScreen) =>
	screen?.rid === other.rid && screen.tmid === other.tmid;

export const focusRoom = (screen: IRoomScreen) => useFocusedRoomStore.setState({ screen });

export const blurRoom = (screen: IRoomScreen) => {
	if (isSameRoomScreen(useFocusedRoomStore.getState().screen, screen)) {
		useFocusedRoomStore.setState({ screen: null });
	}
};
