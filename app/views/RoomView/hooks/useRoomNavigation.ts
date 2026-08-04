import { useEffect, useRef } from 'react';
import parse from 'url-parse';
import { useNavigation } from '@react-navigation/native';

import getRoomInfo from '../../../lib/methods/getRoomInfo';
import { goRoom, type TGoRoomItem } from '../../../lib/methods/helpers/goRoom';
import { useDebounce } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { type TAnyMessageModel } from '../../../definitions';
import {
	type IRoomViewProps,
	type IUseRoomNavigationParams,
	type IUseRoomNavigationResult,
	type TGetMessageInfoResult
} from '../definitions';
import { pushThreadRoom } from '../services/pushThreadRoom';
import { useJumpToMessage } from './useJumpToMessage';

export function useRoomNavigation({
	rid,
	tmid,
	t,
	isMasterDetail,
	listRef,
	roomUserIdRef
}: IUseRoomNavigationParams): IUseRoomNavigationResult {
	const navigation = useNavigation<IRoomViewProps['navigation']>();

	// navToThread needs cancelJumpToMessage, which useJumpToMessage below produces from navToThread —
	// the ref breaks that cycle; the mirror effect after the hook keeps it live (same discipline as useLiveRef).
	const cancelJumpToMessageRef = useRef<() => void>(() => {});

	const navToRoom = async (message: TGetMessageInfoResult) => {
		if (!message.rid) return;
		const roomInfo = await getRoomInfo(message.rid);
		return goRoom({
			item: roomInfo as TGoRoomItem,
			isMasterDetail,
			jumpToMessageId: message.id
		});
	};

	const navToThread = (item: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult) =>
		pushThreadRoom({ rid, item, roomUserId: roomUserIdRef.current, navigation, onCancel: cancelJumpToMessageRef.current });

	const { jumpToMessage, cancelJumpToMessage, consumeJumpParam, onThreadMessagesLoaded } = useJumpToMessage({
		rid,
		tmid,
		t,
		listRef,
		navToRoom,
		navToThread
	});

	useEffect(() => {
		cancelJumpToMessageRef.current = cancelJumpToMessage;
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
