import { useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { getRoomTitle } from '../../lib/methods/helpers';
import { isInviteSubscription } from '../../lib/methods/isInviteSubscription';
import { getInvitationActions, getInvitationText } from '../../lib/methods/getInvitationData';
import { type IInviteSubscription } from '../../definitions';
import { type IRoomScreenInput, type IRoomViewProps } from './definitions';
import { EncryptedRoom } from './components/EncryptedRoom';
import { InvitedRoomScreen } from './components/InvitedRoomScreen';
import { MissingRoomE2EEKey } from './components/MissingRoomE2EEKey';
import { RoomRouteInvalid } from './components/RoomRouteInvalid';
import RoomScreen from './RoomScreen';
import { parseRoomRoute } from './services/parseRoomRoute';
import { createRoomStore, observeRoom } from './stores/RoomStore';
import { type RoomStore } from './definitions';
import { useE2EEStatus } from './hooks/useE2EEStatus';
import { useHeader } from './hooks/useHeader';

interface IRoomGateProps extends IRoomViewProps {
	input: IRoomScreenInput;
}

const RoomGate = ({ route, navigation, input }: IRoomGateProps) => {
	const { rid, t, tmid, name, initialRoom, roomUserId } = input;

	const [roomStore] = useState<RoomStore>(() => createRoomStore({ rid, initialRoom, roomUserId }));
	const [ready, setReady] = useState(false);
	useEffect(() => observeRoom(rid, roomStore, () => setReady(true)), [rid, roomStore]);
	const isInvited = useStore(roomStore, s => 'id' in s.room && isInviteSubscription(s.room));
	const isEncryptable = useStore(roomStore, s => 'encrypted' in s.room);
	const { title, description, inviter } = useStore(
		roomStore,
		useShallow(s =>
			'id' in s.room && isInviteSubscription(s.room)
				? getInvitationText(s.room)
				: { title: '', description: '', inviter: undefined }
		)
	);
	const roomTitle = useStore(roomStore, s => getRoomTitle(s.room));

	const { showMissingE2EEKey, showE2EEDisabledRoom } = useE2EEStatus(roomStore);

	useHeader({ rid, tmid, name, roomStore });

	if (isInvited) {
		return (
			<InvitedRoomScreen
				title={title}
				description={description}
				inviter={inviter as IInviteSubscription['inviter']}
				onAccept={() => getInvitationActions(roomStore.getState().room as IInviteSubscription).accept()}
				onReject={() => getInvitationActions(roomStore.getState().room as IInviteSubscription).reject()}
			/>
		);
	}

	if (isEncryptable) {
		if (showMissingE2EEKey) {
			return <MissingRoomE2EEKey />;
		}

		if (showE2EEDisabledRoom) {
			return <EncryptedRoom navigation={navigation} roomName={roomTitle} />;
		}
	}

	return <RoomScreen route={route} rid={rid} t={t} tmid={tmid} roomStore={roomStore} ready={ready} />;
};

const RoomView = ({ route, navigation }: IRoomViewProps) => {
	const [parsed] = useState(() => parseRoomRoute(route.params));

	if (parsed.status === 'invalid') {
		return <RoomRouteInvalid navigation={navigation} />;
	}

	return <RoomGate route={route} navigation={navigation} input={parsed.input} />;
};

export default RoomView;
