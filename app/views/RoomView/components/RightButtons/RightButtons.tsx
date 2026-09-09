import { type ReactElement } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type RoomStore } from '../../definitions';
import { OmnichannelRightButtons } from './OmnichannelRightButtons';
import { RoomRightButtons } from './RoomRightButtons';
import { ThreadRightButtons } from './ThreadRightButtons';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement | null => {
	const { t, status } = useStore(
		roomStore,
		useShallow(s => ({ t: s.room.t, status: s.room.status }))
	);

	if (!rid) {
		return null;
	}

	if (status === 'INVITED') {
		return null;
	}

	if (t === 'l') {
		if (status === 'queued') {
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
