import { type RefObject } from 'react';

import I18n from '../../../i18n';
import { getThreadById } from '../../../lib/database/services/Thread';
import getThreadName from '../../../lib/methods/getThreadName';
import EventEmitter from '../../../lib/methods/helpers/events';
import log, { events, logEvent } from '../../../lib/methods/helpers/log';
import { Review } from '../../../lib/methods/helpers/review';
import { sendMessage } from '../../../lib/methods/sendMessage';
import { toggleFollowMessage } from '../../../lib/services/restApi';
import { LISTENER } from '../../../containers/Toast';
import { type IRoomViewProps } from '../definitions';
import { type RoomStore } from '../stores/RoomStore';

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

export interface IUseRoomActionsParams {
	rid?: string;
	tmid?: string;
	roomStore: RoomStore;
	userRef: RefObject<IRoomViewProps['user']>;
	resetAction: () => void;
}

interface IUseRoomActionsResult {
	onJoin: () => void;
	handleSendMessage: (message?: string, tshow?: boolean) => void;
	toggleFollowThread: (isFollowingThread: boolean, threadId?: string) => Promise<void>;
	fetchThreadName: (threadId: string, messageId: string) => Promise<string | undefined>;
}

export function useRoomActions({ rid, tmid, roomStore, userRef, resetAction }: IUseRoomActionsParams): IUseRoomActionsResult {
	'use memo';

	const handleSendMessage = (message?: string, tshow?: boolean) => {
		if (message === undefined) {
			return;
		}
		logEvent(events.ROOM_SEND_MESSAGE);
		sendMessage(rid as string, message, tmid, userRef.current, tshow).then(() => {
			roomStore.getState().markMessageSent();
			Review.pushPositiveEvent();
		});
		resetAction();
	};

	const onJoin = () => {
		roomStore.getState().join();
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

	return {
		onJoin,
		handleSendMessage,
		toggleFollowThread,
		fetchThreadName
	};
}
