import { type ReactElement } from 'react';

import { type RoomStore } from '../../definitions';
import { useRoomWithUpdateFromStore } from '../../../../lib/hooks/useRoomWithUpdateFromStore';
import { OmnichannelRightButtons } from './OmnichannelRightButtons';
import { RoomRightButtons } from './RoomRightButtons';
import { ThreadRightButtons } from './ThreadRightButtons';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement | null => {
	const room = useRoomWithUpdateFromStore(roomStore);

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
