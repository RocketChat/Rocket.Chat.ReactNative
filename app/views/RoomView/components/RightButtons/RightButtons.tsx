import { type ReactElement } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type RoomStore } from '../../definitions';
import { isSubscriptionModel } from '../../../../definitions/TRoom';
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
			status: isSubscriptionModel(s.room) ? s.room.status : undefined,
			membership: s.membership
		}))
	);

	if (!rid) {
		return null;
	}

	if (membership === 'invited') {
		return null;
	}

	if (t === 'l') {
		if (status === 'queued' || membership !== 'subscribed') {
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
