import { Alert } from 'react-native';

import { Services } from '../../services';
import database from '../../database';
import { getSubscriptionByRoomId } from '../../database/services/Subscription';
import log from '../../methods/helpers/log';
import I18n from '../../../i18n';
import { TSubscriptionModel } from '../../../definitions';

const optimisticUpdate = async (room: TSubscriptionModel, value: TSubscriptionModel['encrypted']) => {
	try {
		const db = database.active;

		// Instantly feedback to the user
		await db.write(async () => {
			await room.update(r => {
				r.encrypted = value;
			});
		});
	} catch {
		// do nothing
	}
};

export const toggleRoomE2EE = async (rid: string): Promise<void> => {
	const room = await getSubscriptionByRoomId(rid);
	if (!room) {
		return;
	}

	const isEncrypted = room.encrypted;
	const title = I18n.t(isEncrypted ? 'Disable_encryption_title' : 'Enable_encryption_title');
	const message = I18n.t(isEncrypted ? 'Disable_encryption_description' : 'Enable_encryption_description');
	const confirmationText = I18n.t(isEncrypted ? 'Disable' : 'Enable');

	// Toggle encrypted value
	const newValue = !room.encrypted;

	// Instantly feedback to the user
	await optimisticUpdate(room, newValue);

	Alert.alert(
		title,
		message,
		[
			{
				text: I18n.t('Cancel'),
				style: 'cancel',
				onPress: async () => {
					// Revert to original value
					await optimisticUpdate(room, !newValue);
				}
			},
			{
				text: confirmationText,
				style: isEncrypted ? 'destructive' : 'default',
				onPress: async () => {
					try {
						try {
							// Send new room setting value to server
							const { result } = await Services.saveRoomSettings(rid, { encrypted: newValue });
							// If it was saved successfully
							if (result) {
								return;
							}
						} catch {
							// do nothing
						}

						// If something goes wrong we go back to the previous value
						await optimisticUpdate(room, !newValue);
					} catch (e) {
						log(e);
					}
				}
			}
		],
		{ cancelable: true }
	);
};
