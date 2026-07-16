import { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import I18n from '../../../i18n';
import { replyBroadcast as replyBroadcastAction } from '../../../actions/messages';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { callJitsi } from '../../../lib/methods/callJitsi';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { sendMessage } from '../../../lib/methods/sendMessage';
import { setReaction } from '../../../lib/services/restApi';
import { isInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { getUserSelector } from '../../../selectors/login';
import { type IEmoji, type IMessage, type IUseRoomMessageHandlersResult, type TAnyMessageModel } from '../../../definitions';
import { useActionSheet } from '../../../containers/ActionSheet';
import ReactionsList from '../../../containers/ReactionsList';
import { MessageActionStoreContext } from '../../../containers/message/stores/MessageActionStore';
import { useRoomTmid } from '../../../containers/message/stores/MessageRoomStore';
import { type IRoomViewProps } from '../definitions';
import { RoomStoreContext, useRoomStore } from '../stores/RoomStoreContext';
import { blockAction as blockActionService } from '../services/blockAction';
import { fetchThreadName as fetchThreadNameService } from '../services/fetchThreadName';
import { toggleFollowThread as toggleFollowThreadService } from '../services/toggleFollowThread';
import { pushThreadRoom } from '../services/pushThreadRoom';

export function useRoomMessageHandlers(): IUseRoomMessageHandlersResult {
	'use memo';

	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const dispatch = useDispatch();
	const isMasterDetail = useMasterDetail();
	const user = useAppSelector(getUserSelector);
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const roomStore = useContext(RoomStoreContext);
	const messageActionStore = useContext(MessageActionStoreContext);
	const tmid = useRoomTmid();
	const rid = useRoomStore(s => s.room.rid);
	const room = useRoomStore(s => s.room);
	const roomUserId = useRoomStore(s => s.roomUserId);

	if (!roomStore) {
		throw new Error('useRoomMessageHandlers must be used within a RoomStoreContext.Provider');
	}
	if (!messageActionStore) {
		throw new Error('useRoomMessageHandlers must be used within a MessageActionProvider');
	}

	const resetAction = () => {
		messageActionStore.getState().actions.clear();
	};

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

	// No orchestrator-owned cancelJumpToMessageRef to self-source here, so the loading overlay renders without a cancel button.
	const onThreadPress = (item: TAnyMessageModel) => pushThreadRoom({ rid, item, roomUserId, navigation });

	const blockAction = (params: Parameters<IUseRoomMessageHandlersResult['blockAction']>[0]) => blockActionService(params);

	const navToRoomInfo = (navParam: any) => {
		logEvent(events[`ROOM_GO_${navParam.t === 'd' ? 'USER' : 'ROOM'}_INFO`]);
		navParam.fromRid = rid;
		if (isMasterDetail) {
			navParam.showCloseModal = true;
			// @ts-ignore
			navigation.navigate('ModalStackNavigator', { screen: 'RoomInfoView', params: navParam });
		} else {
			navigation.navigate('RoomInfoView', navParam);
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
		const screen = { screen: 'E2EHowItWorksView', params: { showCloseModal: true } };
		if (isMasterDetail) {
			// @ts-ignore
			return navigation.navigate('ModalStackNavigator', screen);
		}
		// @ts-ignore
		navigation.navigate('E2ESaveYourPasswordStackNavigator', screen);
	};

	const showAttachment = (attachment: Parameters<IUseRoomMessageHandlersResult['showAttachment']>[0]) => {
		// @ts-ignore
		navigation.navigate('AttachmentView', { attachment });
	};

	const onReactionClose = () => {
		resetAction();
		hideActionSheet();
	};

	const onReactionPress = async (emoji: IEmoji, messageId: string) => {
		try {
			let shortname = '';
			if (typeof emoji === 'string') {
				shortname = emoji;
			} else {
				shortname = emoji.name;
			}
			await setReaction(shortname, messageId);
			onReactionClose();
			Review.pushPositiveEvent();
		} catch (e) {
			log(e);
		}
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

	const onAnswerButtonPress = (message?: string, tshow?: boolean) => {
		if (message === undefined) {
			return;
		}
		logEvent(events.ROOM_SEND_MESSAGE);
		sendMessage(rid, message, tmid, user, tshow).then(() => {
			roomStore.getState().markMessageSent();
			Review.pushPositiveEvent();
		});
		resetAction();
	};

	return {
		blockAction,
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
		onAnswerButtonPress
	};
}
