import I18n from '../../../i18n';
import { sendLoadingEvent } from '../../../containers/Loading';
import log from '../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { loadSurroundingMessages } from '../../../lib/methods/loadSurroundingMessages';
import { resolveJumpAnchor } from './resolveJumpAnchor';
import getMessageInfo from './getMessageInfo';
import getLocalAnchorTs from './getLocalAnchor';
import { type IJumpToMessageArgs, type TGetMessageInfoResult } from '../definitions';

export const jumpToMessage = async ({
	messageId,
	isFromReply,
	rid,
	tmid,
	t,
	listContainerRef,
	navToRoom,
	navToThread,
	cancel
}: IJumpToMessageArgs): Promise<void> => {
	const isTargetOutsideCurrentView = (message: TGetMessageInfoResult) => {
		if (message.tmid && message.tmid === tmid) {
			return false;
		}
		if (!message.tmid && message.rid === rid) {
			return false;
		}
		return true;
	};

	try {
		sendLoadingEvent({ visible: true, onCancel: cancel });
		const message = await getMessageInfo(messageId);

		if (!message) {
			cancel();
			return;
		}

		if (isTargetOutsideCurrentView(message)) {
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
			const inWindow = listContainerRef.current?.isMessageInWindow(message.id) ?? false;
			const highTs = await resolveJumpAnchor(
				rid,
				{ id: message.id, tmid: message.tmid, ts: message.ts, fromServer: message.fromServer },
				inWindow,
				{ loadSurroundingMessages, getLocalAnchorTs }
			);
			// Synchronization needed for Fabric to work
			await new Promise(res => setTimeout(res, 100));
			await listContainerRef.current?.jumpToMessage(message.id, highTs);
			sendLoadingEvent({ visible: false });
		}
	} catch (error: any) {
		if (isFromReply && error.data?.errorType === 'error-not-allowed') {
			showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
		} else {
			log(error);
		}
		cancel();
	}
};
