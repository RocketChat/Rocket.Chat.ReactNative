import { type RefObject } from 'react';
import parse from 'url-parse';

import I18n from '../../../i18n';
import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { useDebounce } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';
import { sendLoadingEvent } from '../../../containers/Loading';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { SubscriptionType, type TAnyMessageModel } from '../../../definitions';
import { type IListContainerRef } from '../List/definitions';
import { type TGetMessageInfoResult } from '../services/getMessageInfo';
import { type IRoomViewProps } from '../definitions';
import { useJumpToMessage } from './useJumpToMessage';

export interface IUseRoomNavigationParams {
	rid?: string;
	tmid?: string;
	t?: string;
	navigation: IRoomViewProps['navigation'];
	isMasterDetail: boolean;
	listRef: RefObject<IListContainerRef | null>;
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
	onThreadPress: (item: TAnyMessageModel) => void;
	jumpToMessageByUrl: (messageUrl?: string, isFromReply?: boolean) => Promise<void>;
}

export function useRoomNavigation({
	rid,
	tmid,
	t,
	navigation,
	isMasterDetail,
	listRef,
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

	return {
		navToRoom,
		navToThread,
		jumpToMessage,
		cancelJumpToMessage,
		consumeJumpParam,
		onThreadMessagesLoaded,
		onThreadPress,
		jumpToMessageByUrl
	};
}
