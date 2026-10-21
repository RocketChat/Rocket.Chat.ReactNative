import { create } from 'zustand';

import type { Room } from './livekit';

type TConferenceRoomStore = {
	room?: Room;
	setRoom: (room?: Room) => void;
};

export const useConferenceRoomStore = create<TConferenceRoomStore>(set => ({
	room: undefined,
	setRoom: room => set({ room })
}));
