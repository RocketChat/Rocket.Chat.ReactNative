import { useState } from 'react';

import { type ICategoryRoom } from '../types';
import { isRoomIn, toggleRoomIn } from '../utils/roomSelection';

export const useRoomSelection = (initialRooms: ICategoryRoom[] = []) => {
	const [selectedRooms, setSelectedRooms] = useState(initialRooms);

	const isSelected = (rid: string) => isRoomIn(selectedRooms, rid);

	const toggleRoom = (room: ICategoryRoom) => setSelectedRooms(current => toggleRoomIn(current, room));

	return { selectedRooms, isSelected, toggleRoom };
};
