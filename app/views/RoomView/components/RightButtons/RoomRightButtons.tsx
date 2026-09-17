import { type ReactElement } from 'react';

import { isIOS, isTablet } from '~/lib/methods/helpers';
import { type RoomStore } from '~/views/RoomView/definitions';
import { RoomRightButtonsLegacy } from './RoomRightButtonsLegacy';
import { RoomRightButtonsNative } from './RoomRightButtonsNative';
import { useRoomRightButtonsData } from './useRoomRightButtonsData';

interface IRoomRightButtonsProps {
	rid: string;
	roomStore: RoomStore;
}

export const RoomRightButtons = ({ rid, roomStore }: IRoomRightButtonsProps): ReactElement => {
	const useNativeBar = isIOS && !isTablet;
	const data = useRoomRightButtonsData(rid, roomStore);

	if (useNativeBar) {
		return <RoomRightButtonsNative rid={rid} roomStore={roomStore} data={data} />;
	}

	return <RoomRightButtonsLegacy rid={rid} data={data} />;
};
