import { useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { createStore, useStore } from 'zustand';

import I18n from '../../../i18n';
import { replyBroadcast as replyBroadcastAction } from '../../../actions/messages';
import { getThreadById } from '../../../lib/database/services/Thread';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import getThreadName from '../../../lib/methods/getThreadName';
import { callJitsi } from '../../../lib/methods/callJitsi';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { useDebounce } from '../../../lib/methods/helpers';
import EventEmitter from '../../../lib/methods/helpers/events';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { sendMessage } from '../../../lib/methods/sendMessage';
import { triggerBlockAction } from '../../../lib/methods/triggerActions';
import { setReaction, toggleFollowMessage } from '../../../lib/services/restApi';
import { isInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useMasterDetail } from '../../../lib/hooks/useMasterDetail';
import { getUserSelector } from '../../../selectors/login';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { type IAttachment, type IEmoji, type IMessage, SubscriptionType, type TAnyMessageModel } from '../../../definitions';
import { type IRoomViewProps, type RoomState } from '../../../views/RoomView/definitions';
import { RoomStoreContext } from '../../../views/RoomView/stores/RoomStoreContext';
import { useActionSheet } from '../../ActionSheet';
import { sendLoadingEvent } from '../../Loading';
import { LISTENER } from '../../Toast';
import ReactionsList from '../../ReactionsList';
import { MessageActionStoreContext } from '../stores/MessageActionStore';
import { useRoomTmid } from '../stores/MessageRoomStore';
import { ContainerTypes } from '../../UIKit/interfaces';

// Keeps the store hooks below unconditional when RoomStore/MessageActionStore contexts are absent (optional mode);
// its values are never acted on since the hook returns undefined first. Optional mode still requires MessageRoomProvider.
const noOpAsync = async () => undefined;
const noOp = () => undefined;
const FALLBACK_ROOM_STORE = createStore<RoomState>()(() => ({
	room: { rid: '', t: '' },
	roomUpdate: {},
	joined: true,
	subscribed: false,
	member: {},
	roomUserId: null,
	loading: false,
	lastOpen: null,
	canAutoTranslate: false,
	canForwardGuest: false,
	canReturnQueue: false,
	canViewCannedResponse: false,
	canPlaceLivechatOnHold: false,
	init: noOpAsync,
	join: noOp,
	markMessageSent: noOp
}));

const toggleFollowThreadImpl = async (tmid: string | undefined, isFollowingThread: boolean, threadId?: string) => {
	try {
		const threadMessageId = threadId ?? tmid;
		if (!threadMessageId) {
			return;
		}
		await toggleFollowMessage(threadMessageId, !isFollowingThread);
		EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
	} catch (e) {
		log(e);
	}
};

export interface IUseRoomMessageHandlersResult {
	blockAction: (params: {
		actionId: string;
		appId: string;
		value: any;
		blockId: string;
		rid: string;
		mid: string;
	}) => ReturnType<typeof triggerBlockAction>;
	navToRoomInfo: (navParam: any) => void;
	handleEnterCall: () => void;
	onDiscussionPress: (drid: TAnyMessageModel['drid']) => void;
	onThreadPress: (item: TAnyMessageModel) => void;
	onEncryptedPress: () => void;
	showAttachment: (attachment: IAttachment) => void;
	onReactionPress: (emoji: IEmoji, messageId: string) => Promise<void>;
	onReactionLongPress: (message: TAnyMessageModel) => void;
	replyBroadcast: (message: IMessage) => void;
	fetchThreadName: (threadId: string, messageId: string) => Promise<string | undefined>;
	toggleFollowThread: (isFollowingThread: boolean, threadId?: string) => Promise<void>;
	onAnswerButtonPress: (message?: string, tshow?: boolean) => void;
}

export function useRoomMessageHandlers(): IUseRoomMessageHandlersResult;
export function useRoomMessageHandlers(options: { optional: true }): IUseRoomMessageHandlersResult | undefined;
export function useRoomMessageHandlers(options?: { optional?: boolean }): IUseRoomMessageHandlersResult | undefined {
	'use memo';

	const navigation = useNavigation<IRoomViewProps['navigation']>();
	const dispatch = useDispatch();
	const isMasterDetail = useMasterDetail();
	const user = useAppSelector(getUserSelector);
	const { showActionSheet, hideActionSheet } = useActionSheet();

	const roomStore = useContext(RoomStoreContext);
	const messageActionStore = useContext(MessageActionStoreContext);
	const tmid = useRoomTmid();

	// Reads a fallback store when a context is missing so every hook below runs unconditionally
	// (Rules of Hooks); the two checks after them decide whether to actually use the result.
	const rid = useStore(roomStore ?? FALLBACK_ROOM_STORE, (s: RoomState) => s.room.rid);
	const room = useStore(roomStore ?? FALLBACK_ROOM_STORE, (s: RoomState) => s.room);
	const roomUserId = useStore(roomStore ?? FALLBACK_ROOM_STORE, (s: RoomState) => s.roomUserId);

	const onDiscussionPress = useDebounce(
		async (drid: TAnyMessageModel['drid']) => {
			if (!drid) return;
			const discussion = await getRoomInfo(drid);
			if (discussion) {
				goRoom({
					item: discussion as TGoRoomItem,
					isMasterDetail
				});
			}
		},
		1000,
		{ leading: true, trailing: false }
	);

	const navToThread = async (item: TAnyMessageModel) => {
		if (!rid) {
			return;
		}

		if (item.tmid) {
			let name = '';
			let jumpToMessageId = '';
			if ('id' in item) {
				name = 'tmsg' in item ? item.tmsg ?? '' : '';
				jumpToMessageId = item.id;
			}
			// No orchestrator-owned cancelJumpToMessageRef to self-source here, so the loading overlay renders without a cancel button.
			sendLoadingEvent({ visible: true });
			const threadRecord = await getThreadById(item.tmid);
			if (threadRecord?.t === 'rm') {
				name = I18n.t('Thread');
			}
			if (!name) {
				const result = await getThreadName(rid, item.tmid, jumpToMessageId);
				if (!result) {
					sendLoadingEvent({ visible: false });
					return;
				}
				name = result;
			}
			if ('id' in item && 't' in item && item.t === E2E_MESSAGE_TYPE && 'e2e' in item && item.e2e !== E2E_STATUS.DONE) {
				name = I18n.t('Encrypted_message');
			}
			if (!jumpToMessageId) {
				setTimeout(() => {
					sendLoadingEvent({ visible: false });
				}, 300);
			}
			return navigation.push('RoomView', {
				rid,
				tmid: item.tmid,
				name,
				t: SubscriptionType.THREAD,
				roomUserId,
				jumpToMessageId
			});
		}

		if ('tlm' in item) {
			return navigation.push('RoomView', {
				rid,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId
			});
		}
	};

	const onThreadPress = useDebounce((item: TAnyMessageModel) => navToThread(item), 1000, { leading: true, trailing: false });

	if (!roomStore) {
		if (options?.optional) return undefined;
		throw new Error('useRoomMessageHandlers must be used within a RoomStoreContext.Provider');
	}

	if (!messageActionStore) {
		if (options?.optional) return undefined;
		throw new Error('useRoomMessageHandlers must be used within a MessageActionProvider');
	}
	const resetAction = () => {
		messageActionStore.getState().actions.clear();
	};

	const blockAction = ({
		actionId,
		appId,
		value,
		blockId,
		rid: blockRid,
		mid
	}: {
		actionId: string;
		appId: string;
		value: any;
		blockId: string;
		rid: string;
		mid: string;
	}) =>
		triggerBlockAction({
			blockId,
			actionId,
			value,
			mid,
			rid: blockRid,
			appId,
			container: {
				type: ContainerTypes.MESSAGE,
				id: mid
			}
		});

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

	const showAttachment = (attachment: IAttachment) => {
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

	// The original closes the emoji keyboard first via messageComposerRef (orchestrator-only, not self-sourceable);
	// this leaf-called version shows the action sheet directly instead.
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

	const fetchThreadName = async (threadId: string, messageId: string) => {
		const threadRecord = await getThreadById(threadId);
		if (threadRecord?.t === 'rm') {
			return I18n.t('Message_removed');
		}
		return getThreadName(rid as string, threadId, messageId);
	};

	const toggleFollowThread = (isFollowingThread: boolean, threadId?: string) =>
		toggleFollowThreadImpl(tmid, isFollowingThread, threadId);

	const onAnswerButtonPress = (message?: string, tshow?: boolean) => {
		if (message === undefined) {
			return;
		}
		logEvent(events.ROOM_SEND_MESSAGE);
		sendMessage(rid as string, message, tmid, user, tshow).then(() => {
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
