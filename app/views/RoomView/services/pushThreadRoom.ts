import I18n from '../../../i18n';
import { makeThreadName } from '../../../lib/methods/helpers/room';
import { sendLoadingEvent } from '../../../containers/Loading';
import { fetchThreadName } from './fetchThreadName';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../../lib/constants/keys';
import { SubscriptionType, type TAnyMessageModel } from '../../../definitions';
import { type IRoomViewProps, type TGetMessageInfoResult } from '../definitions';

interface IPushThreadRoomParams {
	rid?: string;
	item: TAnyMessageModel | { tmid: string } | TGetMessageInfoResult;
	roomUserId: string | null | undefined;
	navigation: IRoomViewProps['navigation'];
	onCancel?: () => void;
}

export const pushThreadRoom = async ({ rid, item, roomUserId, navigation, onCancel }: IPushThreadRoomParams): Promise<void> => {
	if (!rid) {
		return;
	}

	if (item.tmid) {
		const jumpToMessageId = 'id' in item ? item.id : '';
		const knownName = 'id' in item && 'tmsg' in item ? (item.tmsg ?? '') : '';
		let cancelled = false;
		sendLoadingEvent({
			visible: true,
			onCancel: () => {
				cancelled = true;
				onCancel?.();
			}
		});
		let threadName: string | undefined;
		try {
			threadName = await fetchThreadName(rid, item.tmid, jumpToMessageId, knownName);
		} catch (e) {
			sendLoadingEvent({ visible: false });
			throw e;
		}
		if (!threadName || cancelled) {
			sendLoadingEvent({ visible: false });
			return;
		}
		const isUndecryptable =
			'id' in item && 't' in item && item.t === E2E_MESSAGE_TYPE && 'e2e' in item && item.e2e !== E2E_STATUS.DONE;
		if (!jumpToMessageId) {
			setTimeout(() => {
				sendLoadingEvent({ visible: false });
			}, 300);
		}
		return navigation.push('RoomView', {
			rid,
			tmid: item.tmid,
			name: isUndecryptable ? I18n.t('Encrypted_message') : threadName,
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
