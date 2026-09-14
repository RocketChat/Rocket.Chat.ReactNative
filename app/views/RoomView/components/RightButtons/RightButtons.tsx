import { useNavigation } from '@react-navigation/native';
import { type TRoomStackNavigation } from '~/views/RoomView/services/navigateToScreen';
import { ApplyRoomHeaderItems } from './ApplyRoomHeaderItems';
import { type ReactElement } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { type RoomStore } from '~/views/RoomView/definitions';
import { fromSubscription } from '~/views/RoomView/stores/RoomStoreContext';
import { OmnichannelRightButtons } from './OmnichannelRightButtons';
import { RoomRightButtons } from './RoomRightButtons';
import { ThreadRightButtons } from './ThreadRightButtons';

interface IRightButtonsProps {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
}

const RightButtons = ({ rid, tmid, roomStore }: IRightButtonsProps): ReactElement | null => {
	const navigation = useNavigation<TRoomStackNavigation>();
	const { t, status, membership } = useStore(
		roomStore,
		useShallow(s => ({
			t: s.room.t,
			status: fromSubscription(room => room.status, undefined)(s),
			membership: s.membership
		}))
	);

	if (!rid) {
		return <ApplyRoomHeaderItems navigation={navigation} actions={[]} />;
	}

	if (membership === 'invited') {
		return <ApplyRoomHeaderItems navigation={navigation} actions={[]} />;
	}

	if (t === 'l') {
		if (status === 'queued' || membership !== 'subscribed') {
			return <ApplyRoomHeaderItems navigation={navigation} actions={[]} />;
		}
		return <OmnichannelRightButtons rid={rid} roomStore={roomStore} />;
	}

	if (tmid) {
		return <ThreadRightButtons tmid={tmid} roomStore={roomStore} />;
	}

	return <RoomRightButtons rid={rid} roomStore={roomStore} />;
};

export default RightButtons;
