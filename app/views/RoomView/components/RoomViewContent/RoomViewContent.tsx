import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

import { getRoomTitle } from '~/lib/methods/helpers';
import { isInviteSubscription } from '~/lib/methods/isInviteSubscription';
import { getInvitationActions, getInvitationText } from '~/lib/methods/getInvitationData';
import { type IInviteSubscription } from '~/definitions';
import { isSubscriptionModel } from '~/definitions/TRoom';
import { type IRoomViewProps, type RoomStore } from '~/views/RoomView/definitions';
import RoomScreen from '~/views/RoomView/RoomScreen';
import { useE2EEStatus } from '~/views/RoomView/hooks/useE2EEStatus';
import { EncryptedRoom } from '../EncryptedRoom';
import { InvitedRoomScreen } from '../InvitedRoomScreen';
import { MissingRoomE2EEKey } from '../MissingRoomE2EEKey';
import { RoomBackground } from '../RoomBackground';

interface IRoomViewContentProps extends IRoomViewProps {
	rid?: string;
	t?: string;
	tmid?: string;
	roomStore: RoomStore;
	ready: boolean;
}

export const RoomViewContent = ({ route, navigation, rid, t, tmid, roomStore, ready }: IRoomViewContentProps) => {
	const isEncryptable = useStore(roomStore, s => isSubscriptionModel(s.room));
	const invitation = useStore(
		roomStore,
		useShallow(s => (isSubscriptionModel(s.room) && isInviteSubscription(s.room) ? getInvitationText(s.room) : null))
	);
	const roomTitle = useStore(roomStore, s => getRoomTitle(s.room));

	const { showMissingE2EEKey, showE2EEDisabledRoom } = useE2EEStatus(roomStore);

	if (!rid || !t) {
		return <RoomBackground />;
	}

	if (invitation) {
		return (
			<InvitedRoomScreen
				title={invitation.title}
				description={invitation.description}
				inviter={invitation.inviter as IInviteSubscription['inviter']}
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
