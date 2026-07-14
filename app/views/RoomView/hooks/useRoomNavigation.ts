import { type RefObject } from 'react';
import parse from 'url-parse';
import { type NavigatorScreenParams } from '@react-navigation/native';

import { type TNavigation } from '../../../stacks/stackType';
import I18n from '../../../i18n';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { useDebounce } from '../../../lib/methods/helpers';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';
import { sendLoadingEvent } from '../../../containers/Loading';
import { callJitsi } from '../../../lib/methods/callJitsi';
import { isInActiveVoipCall } from '../../../lib/services/voip/isInActiveVoipCall';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { type ISubscription, SubscriptionType, type TAnyMessageModel, type TSubscriptionModel } from '../../../definitions';
import { type ModalStackParamList } from '../../../stacks/MasterDetailStack/types';
import { type IListContainerRef } from '../List/definitions';
import { type TGetMessageInfoResult } from '../services/getMessageInfo';
import { type IRoomViewProps, type IRoomViewState } from '../definitions';
import { useJumpToMessage } from './useJumpToMessage';

export interface IUseRoomNavigationParams {
	rid?: string;
	tmid?: string;
	t?: string;
	navigation: IRoomViewProps['navigation'];
	isMasterDetail: boolean;
	listRef: RefObject<IListContainerRef | null>;
	member: IRoomViewState['member'];
	joined: boolean;
	canForwardGuest: boolean;
	canReturnQueue: boolean;
	canViewCannedResponse: boolean;
	canPlaceLivechatOnHold: boolean;
	roomRef: RefObject<IRoomViewState['room']>;
	roomUserIdRef: RefObject<string | null | undefined>;
	cancelJumpToMessageRef: RefObject<() => void>;
}

export interface IUseRoomNavigationResult {
	navToRoom: (message: TGetMessageInfoResult) => Promise<void | undefined>;
	navToThread: (item: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult) => Promise<void | undefined>;
	jumpToMessage: (messageId: string, isFromReply?: boolean) => Promise<void>;
	cancelJumpToMessage: () => void;
	consumeJumpParam: (messageId: string) => void;
	onThreadMessagesLoaded: () => void;
	onDiscussionPress: (drid: TAnyMessageModel['drid']) => void;
	onThreadPress: (item: TAnyMessageModel) => void;
	jumpToMessageByUrl: (messageUrl?: string, isFromReply?: boolean) => Promise<void>;
	onEncryptedPress: () => void;
	navToRoomInfo: (navParam: any) => void;
	handleEnterCall: () => void;
	goRoomActionsView: (screen?: keyof ModalStackParamList) => void;
}

export function useRoomNavigation({
	rid,
	tmid,
	t,
	navigation,
	isMasterDetail,
	listRef,
	member,
	joined,
	canForwardGuest,
	canReturnQueue,
	canViewCannedResponse,
	canPlaceLivechatOnHold,
	roomRef,
	roomUserIdRef,
	cancelJumpToMessageRef
}: IUseRoomNavigationParams): IUseRoomNavigationResult {
	'use memo';

	const navToRoom = async (message: TGetMessageInfoResult) => {
		if (!message.rid) return;
		const roomInfo = await getRoomInfo(message.rid);
		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			jumpToMessageId: message.id
		});
	};

	const navToThread = async (item: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult) => {
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
			sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessageRef.current });
			const threadRecord = await getThreadById(item.tmid);
			if (threadRecord?.t === 'rm') {
				name = I18n.t('Thread');
			}
			if (!name) {
				const result = await getThreadName(rid, item.tmid, jumpToMessageId);
				// test if there isn't a thread
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
				roomUserId: roomUserIdRef.current,
				jumpToMessageId
			});
		}

		if ('tlm' in item) {
			return navigation.push('RoomView', {
				rid,
				tmid: item.id,
				name: makeThreadName(item),
				t: SubscriptionType.THREAD,
				roomUserId: roomUserIdRef.current
			});
		}
	};

	const { jumpToMessage, cancelJumpToMessage, consumeJumpParam, onThreadMessagesLoaded } = useJumpToMessage({
		rid,
		tmid,
		t,
		listRef,
		navToRoom,
		navToThread
	});

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

	const onThreadPress = useDebounce((item: TAnyMessageModel) => navToThread(item), 1000, { leading: true, trailing: false });

	const jumpToMessageByUrl = async (messageUrl?: string, isFromReply?: boolean) => {
		if (!messageUrl) {
			return;
		}
		try {
			const parsedUrl = parse(messageUrl, true);
			const messageId = parsedUrl.query.msg;
			if (messageId) {
				await jumpToMessage(messageId, isFromReply);
			}
		} catch (e) {
			log(e);
		}
	};

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
		const currentRoom = roomRef.current;
		if ('id' in currentRoom) {
			const { jitsiTimeout } = currentRoom;
			if (jitsiTimeout && jitsiTimeout < new Date()) {
				showErrorAlert(I18n.t('Call_already_ended'));
			} else {
				callJitsi({ room: currentRoom });
			}
		}
	};

	const goRoomActionsView = (screen?: keyof ModalStackParamList) => {
		logEvent(events.ROOM_GO_RA);
		if (isMasterDetail) {
			// @ts-ignore — navigation types expect a literal screen name
			navigation.navigate('ModalStackNavigator', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: rid as string,
					t: t as SubscriptionType,
					room: roomRef.current as ISubscription,
					member,
					showCloseModal: !!screen,
					// @ts-ignore
					joined,
					omnichannelPermissions: {
						canForwardGuest,
						canReturnQueue,
						canViewCannedResponse,
						canPlaceLivechatOnHold
					}
				}
			} as NavigatorScreenParams<ModalStackParamList & TNavigation>);
		} else if (rid && t) {
			navigation.push('RoomActionsView', {
				rid,
				t: t as SubscriptionType,
				room: roomRef.current as TSubscriptionModel,
				member,
				joined,
				omnichannelPermissions: {
					canForwardGuest,
					canReturnQueue,
					canViewCannedResponse,
					canPlaceLivechatOnHold
				}
			});
		}
	};

	return {
		navToRoom,
		navToThread,
		jumpToMessage,
		cancelJumpToMessage,
		consumeJumpParam,
		onThreadMessagesLoaded,
		onDiscussionPress,
		onThreadPress,
		jumpToMessageByUrl,
		onEncryptedPress,
		navToRoomInfo,
		handleEnterCall,
		goRoomActionsView
	};
}
