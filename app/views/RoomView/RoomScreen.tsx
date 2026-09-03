import { useRef } from 'react';
import { useStore } from 'zustand';

import { useTheme } from '../../theme';
import SafeAreaView from '../../containers/SafeAreaView';
import { useSetting } from '../../lib/hooks/useSetting';
import { useMasterDetail } from '../../lib/hooks/useMasterDetail';
import JoinCode from './components/JoinCode';
import { type IJoinCode, type IRoomScreenProps } from './definitions';
import { RoomProviders } from './components/RoomProviders';
import { RoomAnnouncementBanner } from './components/RoomAnnouncementBanner';
import { RoomFooter } from './components/RoomFooter/RoomFooter';
import { RoomLoadFailed } from './components/RoomLoadFailed';
import { RoomMessageActions } from './components/RoomMessageActions';
import { RoomMessageList } from './components/RoomMessageList';
import { RoomUploadProgress } from './components/RoomUploadProgress';
import { RoomStoreContext } from './stores/RoomStoreContext';
import { RoomScreenContext } from './stores/RoomScreenContext';
import { useRoomMessaging } from './hooks/useRoomMessaging';
import { useRoomSubscription } from './hooks/useRoomSubscription';
import { useRoomAudioLifecycle } from './hooks/useRoomAudioLifecycle';
import { useRoomRemoved } from './hooks/useRoomRemoved';
import { useOmnichannelPermissions } from './hooks/useOmnichannelPermissions';
import { useInAppFeedback } from './hooks/useInAppFeedback';

const RoomScreen = ({ route, rid, t, tmid, roomStore }: IRoomScreenProps) => {
	const { colors } = useTheme();
	const isMasterDetail = useMasterDetail();
	const livechatAllowManualOnHold = useSetting('Livechat_allow_manual_on_hold') as boolean;

	const room = useStore(roomStore, s => s.room);
	const roomUpdate = useStore(roomStore, s => s.roomUpdate);
	const joined = useStore(roomStore, s => s.joined);
	const roomUserId = useStore(roomStore, s => s.roomUserId);

	useRoomSubscription(rid, tmid);
	useRoomAudioLifecycle(rid, tmid);
	useRoomRemoved(rid, isMasterDetail);
	useInAppFeedback();
	useOmnichannelPermissions({ rid, t, roomUpdate, joined, livechatAllowManualOnHold, roomStore });

	const { messageActionStore, roomScreen, messageComposerRef, composer, messageList, messageActions } = useRoomMessaging({
		rid,
		t,
		tmid,
		roomStore,
		roomUserId,
		quoteMessageId: route.params?.messageId
	});

	const joinCodeRef = useRef<IJoinCode | null>(null);
	const onJoin = () => {
		roomStore.getState().join();
	};

	if (roomScreen.failed) {
		return <RoomLoadFailed onRetry={roomScreen.retry} />;
	}

	return (
		<RoomStoreContext.Provider value={roomStore}>
			<RoomScreenContext.Provider value={roomScreen}>
				<RoomProviders
					store={messageActionStore}
					rid={room.rid}
					t={room.t}
					room={room}
					roomUpdate={roomUpdate}
					tmid={tmid}
					sharing={false}
					{...composer}>
					<SafeAreaView style={{ backgroundColor: colors.surfaceRoom }} testID='room-view'>
						{!tmid ? <RoomAnnouncementBanner /> : null}
						<RoomMessageList tmid={tmid} {...messageList} />
						<RoomFooter messageComposerRef={messageComposerRef} joinCodeRef={joinCodeRef} />
						<RoomMessageActions tmid={tmid} {...messageActions} />
						<RoomUploadProgress />
						<JoinCode ref={joinCodeRef} onJoin={onJoin} rid={room.rid} t={room.t} />
					</SafeAreaView>
				</RoomProviders>
			</RoomScreenContext.Provider>
		</RoomStoreContext.Provider>
	);
};

export default RoomScreen;
