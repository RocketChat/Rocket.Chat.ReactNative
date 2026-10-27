import { create } from 'zustand';

import { type ICategoryRoom } from '../types';
import { toggleRoomIn } from '../utils/roomSelection';

type TCategoryDraftStore = {
	name: string;
	rooms: ICategoryRoom[];
	setName: (name: string) => void;
	toggleRoom: (room: ICategoryRoom) => void;
};

export const useCategoryDraftStore = create<TCategoryDraftStore>(set => ({
	name: '',
	rooms: [],
	setName: name => set({ name }),
	toggleRoom: room => set(({ rooms }) => ({ rooms: toggleRoomIn(rooms, room) }))
}));

export const startCategoryDraft = (rooms: ICategoryRoom[] = []) => useCategoryDraftStore.setState({ name: '', rooms });
