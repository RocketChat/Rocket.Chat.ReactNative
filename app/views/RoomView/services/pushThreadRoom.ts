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

export const pushThreadRoom = async ({
	rid,
	item,
	roomUserId,
	navigation,
	onCancel
}: IPushThreadRoomParams): Promise<void | undefined> => {
	if (!rid) {
		return;
	}

	if (item.tmid) {
		let name = '';
		let jumpToMessageId = '';
		if ('id' in item) {
			name = 'tmsg' in item ? (item.tmsg ?? '') : '';
			jumpToMessageId = item.id;
		}
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
			threadName = await fetchThreadName(rid, item.tmid, jumpToMessageId, name);
		} finally {
			if (!threadName || cancelled) {
				sendLoadingEvent({ visible: false });
			}
		}
		if (!threadName || cancelled) {
			return;
		}
		name = threadName;
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
