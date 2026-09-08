import I18n from '../../../i18n';
import { sendLoadingEvent } from '../../../containers/Loading';
import log from '../../../lib/methods/helpers/log';
import { showErrorAlert } from '../../../lib/methods/helpers/info';
import { loadSurroundingMessages } from '../../../lib/methods/loadSurroundingMessages';
import { resolveJumpAnchor } from './resolveJumpAnchor';
import getMessageInfo from './getMessageInfo';
import getLocalAnchorTs from './getLocalAnchor';
import { type IJumpToMessageArgs } from '../definitions';

const FABRIC_COMMIT_DELAY = 100;

const waitForFabricCommit = (): Promise<void> =>
	new Promise(resolve => {
		setTimeout(resolve, FABRIC_COMMIT_DELAY);
	});

export const jumpToMessage = async ({
	messageId,
	isFromReply,
	rid,
	tmid,
	t,
	listContainerRef,
	navToRoom,
	navToThread,
	cancel,
	isCancelled
}: IJumpToMessageArgs): Promise<void> => {
	try {
		sendLoadingEvent({ visible: true, onCancel: cancel });
		const message = await getMessageInfo(messageId);
		if (isCancelled()) {
			return;
		}

		if (!message) {
			cancel();
			return;
		}

		const inThisThread = !!message.tmid && message.tmid === tmid;
		const inThisRoom = !message.tmid && message.rid === rid;

		if (!inThisThread && !inThisRoom) {
			if (message.rid !== rid) {
				await navToRoom(message);
			} else {
				await navToThread(message);
			}
		} else if (inThisRoom && t === 'thread' && message.id !== tmid) {
			await navToRoom(message);
		} else {
			const inWindow = listContainerRef.current?.isMessageInWindow(message.id) ?? false;
			const highTsMs = await resolveJumpAnchor(
				rid,
				{ id: message.id, tmid: message.tmid, ts: message.ts, fromServer: message.fromServer },
				inWindow,
				{ loadSurroundingMessages, getLocalAnchorTs }
			);
			if (isCancelled()) {
				return;
			}
			await waitForFabricCommit();
			if (isCancelled()) {
				return;
			}
			await listContainerRef.current?.jumpToMessage(message.id, highTsMs);
			sendLoadingEvent({ visible: false });
		}
	} catch (error: any) {
		if (isCancelled()) {
			return;
		}
		if (isFromReply && error.data?.errorType === 'error-not-allowed') {
			showErrorAlert(I18n.t('The_room_does_not_exist'), I18n.t('Room_not_found'));
		} else {
			log(error);
		}
		cancel();
	}
};
