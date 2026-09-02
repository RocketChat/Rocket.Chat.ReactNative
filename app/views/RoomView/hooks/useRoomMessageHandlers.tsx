import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import I18n from '../../../i18n';
import { replyBroadcast as replyBroadcastAction } from '../../../actions/messages';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { callJitsi } from '../../../lib/methods/callJitsi';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { events, logEvent } from '../../../lib/methods/helpers/log';
import { isInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import {
	type IMessage,
	type IRoomInfoParam,
	type IUseRoomMessageHandlersResult,
	SubscriptionType,
	type TAnyMessageModel
} from '../../../definitions';
import { useActionSheet } from '../../../containers/ActionSheet';
import ReactionsList from '../../../containers/ReactionsList';
import { type IRoomActions, type IRoomViewProps } from '../definitions';
import { useRoomStore } from '../../../lib/store/RoomStoreContext';
import { blockAction as blockActionService } from '../services/blockAction';
import { fetchThreadName as fetchThreadNameService } from '../services/fetchThreadName';
import { toggleFollowThread as toggleFollowThreadService } from '../../../lib/methods/toggleFollowThread';

export function useRoomMessageHandlers({
	tmid,
	onThreadPress,
	onReactionPress,
	sendMessage
}: IRoomActions & { tmid?: string }): IUseRoomMessageHandlersResult {
	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const dispatch = useDispatch();
	const isMasterDetail = useMasterDetail();
	const { showActionSheet } = useActionSheet();

	const rid = useRoomStore(s => s.room.rid);
	const room = useRoomStore(s => s.room);

	const onDiscussionPress = async (drid: TAnyMessageModel['drid']) => {
		if (!drid) return;
		const discussion = await getRoomInfo(drid);
		if (discussion) {
			goRoom({
				item: discussion as TGoRoomItem,
				isMasterDetail
			});
		}
	};

	const navToRoomInfo = (navParam: IRoomInfoParam) => {
		logEvent(events[`ROOM_GO_${navParam.t === SubscriptionType.DIRECT ? 'USER' : 'ROOM'}_INFO`]);
		const params = { ...navParam, fromRid: rid };
		if (isMasterDetail) {
			navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: { ...params, showCloseModal: true } });
		} else {
			navigation.navigate('RoomInfoView', params);
		}
	};

	// OLD METHOD - support versions before 5.0.0
	const handleEnterCall = () => {
		if (isInActiveVoipCall()) return;
		if ('id' in room) {
			const { jitsiTimeout } = room;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				callJitsi({ room });
			}
		}
	};

	const onEncryptedPress = () => {
		logEvent(events.ROOM_ENCRYPTED_PRESS);
		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } } as const;
		if (isMasterDetail) {
			return navigation.navigate('ModalStackNavigator', screen);
		}
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	};

	const showAttachment = (attachment: Parameters<IUseRoomMessageHandlersResult['showAttachment']>[0]) => {
		navigation.navigate('AttachmentView', { attachment });
	};

	const onReactionLongPress = (message: TAnyMessageModel) => {
		showActionSheet({
			children: <ReactionsList reactions={message?.reactions} />,
			snaps: ['50%'],
			enableContentPanningGesture: false,
			fullContainer: true
		});
	};

	const replyBroadcast = (message: IMessage) => {
		dispatch(replyBroadcastAction(message));
	};

	const fetchThreadName = (threadId: string, messageId: string) => fetchThreadNameService(rid, threadId, messageId);

	const toggleFollowThread = (isFollowingThread: boolean, threadId?: string) => {
		const threadMessageId = threadId ?? tmid;
		if (!threadMessageId) {
			return Promise.resolve();
		}
		return toggleFollowThreadService(threadMessageId, isFollowingThread);
	};

	return {
		blockAction: blockActionService,
		navToRoomInfo,
		handleEnterCall,
		onDiscussionPress,
		onThreadPress,
		onEncryptedPress,
		showAttachment,
		onReactionPress,
		onReactionLongPress,
		replyBroadcast,
		fetchThreadName,
		toggleFollowThread,
		onAnswerButtonPress: sendMessage
	};
}
