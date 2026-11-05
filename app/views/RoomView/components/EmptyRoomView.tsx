import { type ReactElement } from 'react';

import { useEmptyRoomHeader } from '../hooks/useEmptyRoomHeader';
import { RoomBackground } from './RoomBackground';

export const EmptyRoomView = (): ReactElement => {
	useEmptyRoomHeader();
	return <RoomBackground />;
};
