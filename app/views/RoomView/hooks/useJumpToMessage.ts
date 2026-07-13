import { type RefObject } from 'react';

import I18n from '../../../i18n';
import { sendLoadingEvent } from '../../../containers/Loading';
import log from '../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { loadSurroundingMessages } from '../../../lib/methods/loadSurroundingMessages';
import { type IListContainerRef } from '../List/definitions';
import RoomServices from '../services';
import { resolveJumpAnchor } from '../services/resolveJumpAnchor';
import { type TGetMessageInfoResult } from '../services/getMessageInfo';

export interface IUseJumpToMessageParams {
	rid?: string;
	tmid?: string;
	t?: string;
	listRef: RefObject<IListContainerRef | null>;
	navToRoom: (message: TGetMessageInfoResult) => void;
	navToThread: (message: TGetMessageInfoResult) => void;
}

export interface IUseJumpToMessageResult {
	jumpToMessage: (messageId: string, isFromReply?: boolean) => Promise<void>;
	cancelJumpToMessage: () => void;
}

interface IJumpToMessageContext extends IUseJumpToMessageParams {
	cancelJumpToMessage: () => void;
}

const jumpToMessageImpl = async (
	{ rid, tmid, t, listRef, navToRoom, navToThread, cancelJumpToMessage }: IJumpToMessageContext,
	messageId: string,
	isFromReply?: boolean
) => {
	const shouldNavigateToRoom = (message: TGetMessageInfoResult) => {
		if (message.tmid && message.tmid === tmid) {
			return false;
		}
		if (!message.tmid && message.rid === rid) {
			return false;
		}
		return true;
	};

	try {
		sendLoadingEvent({ visible: true, onCancel: cancelJumpToMessage });
		const message = await RoomServices.getMessageInfo(messageId);

		if (!message) {
			cancelJumpToMessage();
			return;
		}

		if (shouldNavigateToRoom(message)) {
			if (message.rid !== rid) {
				navToRoom(message);
			} else {
				navToThread(message);
			}
		} else if (!message.tmid && message.rid === rid && t === 'thread' && !message.replies) {
			/**
			 * if the user is within a thread and the message that he is trying to jump to, is a message in the main room
			 */
			return navToRoom(message);
		} else {
			/**
			 * if it's from server, we don't have it saved locally and so we fetch surroundings
			 * we test if it's not from threads because we're fetching from threads currently with `loadThreadMessages`
			 *
			 * The fetched Chunk lets us re-anchor the Message Window onto the target in ONE step: if a
			 * Newer Loader brackets the target's Chunk it is non-contiguous with the Live Tail, so we
			 * derive a finite upper ts bound (highTs) for an Anchored Window centered on it. A
			 * contiguous target resolves to null and stays a Live Window. Thread/local targets are
			 * never anchored.
			 */
			const inWindow = listRef.current?.isMessageInWindow(message.id) ?? false;
			const highTs = await resolveJumpAnchor(
				rid,
				{ id: message.id, tmid: message.tmid, ts: message.ts, fromServer: message.fromServer },
				inWindow,
				{ loadSurroundingMessages, getLocalAnchorTs: RoomServices.getLocalAnchorTs }
			);
			// Synchronization needed for Fabric to work
			await new Promise(res => setTimeout(res, 100));
			// The list hook resolves on real completion (or via its own safety net), so we no longer
			// race a 5s timeout that could yank a valid in-flight scroll.
			await listRef.current?.jumpToMessage(message.id, highTs);
			sendLoadingEvent({ visible: false });
		}
	} catch (error: any) {
		if (isFromReply && error.data?.errorType === 'error-not-allowed') {
			showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
		} else {
			log(error);
		}
		cancelJumpToMessage();
	}
};

export function useJumpToMessage({
	rid,
	tmid,
	t,
	listRef,
	navToRoom,
	navToThread
}: IUseJumpToMessageParams): IUseJumpToMessageResult {
	'use memo';

	const cancelJumpToMessage = () => {
		listRef.current?.cancelJumpToMessage();
		sendLoadingEvent({ visible: false });
	};

	const jumpToMessage = (messageId: string, isFromReply?: boolean) =>
		jumpToMessageImpl({ rid, tmid, t, listRef, navToRoom, navToThread, cancelJumpToMessage }, messageId, isFromReply);

	return { jumpToMessage, cancelJumpToMessage };
}
