import { sendLoadingEvent } from '../../../containers/Loading';
import I18n from '../../../i18n';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { SubscriptionType, type TAnyMessageModel } from '../../../definitions';
import { type IRoomViewProps, type TGetMessageInfoResult } from '../definitions';
import { fetchThreadName } from './fetchThreadName';

const DEFERRED_HIDE_DELAY = 300;

export type TOpenThreadTarget = TAnyMessageModel | { tmid: string } | TGetMessageInfoResult;

interface IOpenThreadDeps {
	navigation: IRoomViewProps['navigation'];
	rid?: string;
	roomUserId?: string | null;
	cancelJumpToMessage: () => void;
}

const isUndecryptable = (message: TOpenThreadTarget): boolean =>
	'id' in message && 't' in message && message.t === E2E_MESSAGE_TYPE && 'e2e' in message && message.e2e !== E2E_STATUS.DONE;

export const openThread = async (
	message: TOpenThreadTarget,
	{ navigation, rid, roomUserId, cancelJumpToMessage }: IOpenThreadDeps
): Promise<void> => {
	if (!rid) {
		return;
	}
	const { tmid } = message;
	if (!tmid) {
		if ('tlm' in message) {
			return navigation.push('RoomView', {
				rid,
				tmid: message.id,
				name: makeThreadName(message),
				t: SubscriptionType.THREAD,
				roomUserId
			});
		}
		return;
	}

	const jumpToMessageId = 'id' in message ? message.id : '';
	const knownName = 'id' in message && 'tmsg' in message ? (message.tmsg ?? '') : '';
	let cancelled = false;
	const cancelThread = () => {
		cancelled = true;
		cancelJumpToMessage();
	};
	sendLoadingEvent({ visible: true, onCancel: cancelThread });
	let threadName: string | undefined;
	try {
		threadName = await fetchThreadName(rid, tmid, jumpToMessageId, knownName);
	} catch (error) {
		sendLoadingEvent({ visible: false });
		throw error;
	}
	if (!threadName || cancelled) {
		sendLoadingEvent({ visible: false });
		return;
	}
	if (!jumpToMessageId) {
		setTimeout(() => sendLoadingEvent({ visible: false }), DEFERRED_HIDE_DELAY);
	}
	return navigation.push('RoomView', {
		rid,
		tmid,
		name: isUndecryptable(message) ? I18n.t('Encrypted_message') : threadName,
		t: SubscriptionType.THREAD,
		roomUserId,
		jumpToMessageId
	});
};
