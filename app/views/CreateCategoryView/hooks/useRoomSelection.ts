import { useState } from 'react';

import { type ICategoryRoom } from '../types';

export const useRoomSelection = (initialRooms: ICategoryRoom[] = []) => {
	const [selectedRooms, setSelectedRooms] = useState(initialRooms);

	const isSelected = (rid: string) => selectedRooms.some(room => room.rid === rid);

	const toggleRoom = (room: ICategoryRoom) =>
		setSelectedRooms(current =>
			current.some(selected => selected.rid === room.rid)
				? current.filter(selected => selected.rid !== room.rid)
				: [...current, room]
		);

	return { selectedRooms, isSelected, toggleRoom };
};
