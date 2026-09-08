import { type ReactElement } from 'react';

import { type RoomStore } from '../../definitions';
import { useRoomFromStore } from '../../stores/RoomStoreContext';
import { OmnichannelRightButtons } from './OmnichannelRightButtons';
import { RoomRightButtons } from './RoomRightButtons';
import { ThreadRightButtons } from './ThreadRightButtons';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement | null => {
	const { room } = useRoomFromStore(roomStore);

	if (!rid) {
		return null;
	}

	if (room.status === 'INVITED') {
		return null;
	}

	if (room.t === 'l') {
		if (room.status === 'queued') {
			return null;
		}
		return <OmnichannelRightButtons rid={rid} roomStore={roomStore} />;
	}

	if (tmid) {
		return <ThreadRightButtons tmid={tmid} />;
	}

	return <RoomRightButtons rid={rid} roomStore={roomStore} />;
};

export default RightButtons;
