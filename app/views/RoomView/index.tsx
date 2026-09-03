import { useState } from 'react';

import { getRoomTitle, getUidDirectMessage } from '../../lib/methods/helpers';
import { isInviteSubscription } from '../../lib/methods/isInviteSubscription';
import { type IRoomViewProps, type IRoomViewState } from './definitions';
import { EncryptedRoom } from './components/EncryptedRoom';
import { InvitedRoomScreen } from './components/InvitedRoomScreen';
import { MissingRoomE2EEKey } from './components/MissingRoomE2EEKey';
import RoomScreen from './RoomScreen';
import { useRoomStoreForScreen } from './stores/RoomStore';
import { useRoomWithUpdateFromStore } from './stores/RoomStoreContext';
import { useE2EEStatus } from './hooks/useE2EEStatus';
import { useHeader } from './hooks/useHeader';

const RoomGate = (props: IRoomViewProps) => {
	const { route, navigation } = props;

	const [rid] = useState(() => route.params?.rid);
	const [t] = useState(() => route.params?.t);
	/**
	 * On threads, we don't have a subscription.
	 * `room` is going to have only a few properties sent during navigation.
	 * Use `tmid` as thread id.
	 */
	const [tmid] = useState(() => route.params?.tmid);
	// On a thread this is the thread name, which the observed subscription row never carries.
	const [name] = useState(() => route.params?.name);

	const [initialRoom] = useState<IRoomViewState['room']>(() => ({
		rid: rid as string,
		t: t as string,
		name,
		fname: route.params?.fname,
		prid: route.params?.prid,
		visitor: route.params?.visitor,
		joinCodeRequired: route.params?.joinCodeRequired
	}));
	const [initialRoomUserId] = useState(() => route.params?.roomUserId ?? getUidDirectMessage(initialRoom));

	const roomStore = useRoomStoreForScreen({ rid, initialRoom, roomUserId: initialRoomUserId });
	const room = useRoomWithUpdateFromStore(roomStore);

	const { showMissingE2EEKey, showE2EEDisabledRoom } = useE2EEStatus(rid);

	useHeader({ rid, tmid, name });

	if ('id' in room && isInviteSubscription(room)) {
		return <InvitedRoomScreen room={room} />;
	}

	if ('encrypted' in room) {
		if (showMissingE2EEKey) {
			return <MissingRoomE2EEKey />;
		}

		if (showE2EEDisabledRoom) {
			return <EncryptedRoom navigation={navigation} roomName={getRoomTitle(room)} />;
		}
	}

	return <RoomScreen route={route} rid={rid} t={t} tmid={tmid} roomStore={roomStore} />;
};

export default RoomGate;
