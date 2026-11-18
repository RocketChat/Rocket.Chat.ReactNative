import { type ReactElement } from 'react';

import { useNoRoomSelectedHeader } from '../hooks/useNoRoomSelectedHeader';
import { RoomBackground } from './RoomBackground';

export const NoRoomSelectedView = (): ReactElement => {
	useNoRoomSelectedHeader();
	return <RoomBackground />;
};
