import { type ReactElement } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type RoomStore } from '~/views/RoomView/definitions';
import { fromSubscription } from '~/views/RoomView/stores/RoomStoreContext';
import { getRoomHeaderMode } from '~/views/RoomView/helpers/getRoomHeaderMode';
import { OmnichannelRightButtons } from './OmnichannelRightButtons';
import { RoomRightButtons } from './RoomRightButtons';
import { ThreadRightButtons } from './ThreadRightButtons';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement | null => {
	const { t, status, membership } = useStore(
		roomStore,
		useShallow(s => ({
			t: s.room.t,
			status: fromSubscription(room => room.status, undefined)(s),
			membership: s.membership
		}))
	);

	const mode = getRoomHeaderMode({ rid, tmid, t, status, membership });

	if (!rid || mode === 'none') {
		return null;
	}
	if (mode === 'omnichannel') {
		return <OmnichannelRightButtons rid={rid} roomStore={roomStore} />;
	}
	if (mode === 'thread' && tmid) {
		return <ThreadRightButtons tmid={tmid} />;
	}

	return <RoomRightButtons rid={rid} roomStore={roomStore} />;
};

export default RightButtons;
