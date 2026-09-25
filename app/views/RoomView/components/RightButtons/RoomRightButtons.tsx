import { type ReactElement } from 'react';

import { type RoomStore } from '~/views/RoomView/definitions';
import { RoomRightButtonsLegacy } from './RoomRightButtonsLegacy';
import { useRoomRightButtonsData } from './useRoomRightButtonsData';

interface IRoomRightButtonsProps {
	rid: string;
	roomStore: RoomStore;
}

export const RoomRightButtons = ({ rid, roomStore }: IRoomRightButtonsProps): ReactElement => {
	const data = useRoomRightButtonsData(rid, roomStore);

	return <RoomRightButtonsLegacy rid={rid} data={data} />;
};
