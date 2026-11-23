import { Alert } from 'react-native';

import I18n from '~/i18n';
import { Encryption } from '~/lib/encryption';
import log from '~/lib/methods/helpers/log';
import { showToast } from '~/lib/methods/helpers/showToast';
import { isTwoFactorCancelled } from '~/lib/services/twoFactor/twoFactorCancelled';

export const resetRoomKey = (rid: string) => {
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
						const e2eRoom = await Encryption.getRoomInstance(rid);
						if (!e2eRoom) {
							console.log('Encryption room instance not found');
							return;
						}

						const isReset = await e2eRoom.resetRoomKey();
						if (!isReset) {
							return;
						}

						showToast(I18n.t('Encryption_keys_reset'));
					} catch (e) {
						if (isTwoFactorCancelled(e)) {
							return;
						}
						log(e);
						showToast(I18n.t('Encryption_keys_failed'));
					}
				}
			}
		],
		{ cancelable: true }
	);
};
