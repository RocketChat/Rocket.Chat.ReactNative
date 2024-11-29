import { Alert } from 'react-native';

import I18n from '../../i18n';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import log from '../../lib/methods/helpers/log';
import { showToast } from '../../lib/methods/helpers/showToast';
import { e2eResetRoomKey } from '../../lib/services/restApi';

export const resetRoomKey = async (rid: string): Promise<void> => {
	const room = await getSubscriptionByRoomId(rid);
	if (!room) {
		return;
	}

	Alert.alert(
		I18n.t('Reset_room_key_title'),
		I18n.t('Reset_room_key_message'),
		[
			{
				text: I18n.t('Cancel'),
				style: 'cancel'
			},
			{
				text: I18n.t('Reset'),
				style: 'destructive',
				onPress: async () => {
					try {
						if (room.E2EKey && room.e2eKeyId) {
							await e2eResetRoomKey(rid, room.E2EKey, room.e2eKeyId);
							showToast(I18n.t('Encryption_keys_reset'));
						}
					} catch (e) {
						log(e);
						showToast(I18n.t('Encryption_keys_failed'));
					}
				}
			}
		],
		{ cancelable: true }
	);
};
