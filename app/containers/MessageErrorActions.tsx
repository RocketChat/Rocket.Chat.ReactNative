import { forwardRef, useImperativeHandle } from 'react';
import Model from '@nozbe/watermelondb/Model';

import { getMessageById } from '../lib/database/services/Message';
import { getThreadMessageById } from '../lib/database/services/ThreadMessage';
import database from '../lib/database';
import protectedFunction from '../lib/methods/helpers/protectedFunction';
import { useActionSheet } from './ActionSheet';
import I18n from '../i18n';
import log from '../lib/methods/helpers/log';
import { TMessageModel } from '../definitions';
import { resendMessage } from '../lib/methods';

export interface IMessageErrorActions {
	showMessageErrorActions: (message: TMessageModel) => void;
}

const MessageErrorActions = forwardRef<IMessageErrorActions, { tmid?: string }>(({ tmid }, ref) => {
	const { showActionSheet } = useActionSheet();

	const handleResend = protectedFunction(async (message: TMessageModel) => {
		await resendMessage(message, tmid);
	});

	const handleDelete = async (message: TMessageModel) => {
		try {
			const db = database.active;
			const deleteBatch: Model[] = [];
			const msgCollection = db.get('messages');
			const threadCollection = db.get('threads');

			const msg = await getMessageById(message.id);
			if (msg) {
				deleteBatch.push(msg.prepareDestroyPermanently());
			}

			// If it's a thread, we find and delete the whole tree, if necessary
			if (tmid) {
				const msg = await getThreadMessageById(message.id);
				if (msg) {
					deleteBatch.push(msg.prepareDestroyPermanently());
				}

				try {
					// Find the thread header and update it
					const msg = await msgCollection.find(tmid);
					if (msg?.tcount && msg.tcount <= 1) {
						deleteBatch.push(
							msg.prepareUpdate(m => {
								m.tcount = null;
								m.tlm = null;
							})
						);

						try {
							// If the whole thread was removed, delete the thread
							const thread = await threadCollection.find(tmid);
							deleteBatch.push(thread.prepareDestroyPermanently());
						} catch {
							// Do nothing: thread not found
						}
					} else {
						deleteBatch.push(
							msg.prepareUpdate(m => {
								if (m.tcount) {
									m.tcount -= 1;
								}
							})
						);
					}
				} catch {
					// Do nothing: message not found
				}
			}
			await db.write(async () => {
				await db.batch(...deleteBatch);
			});
		} catch (e) {
			log(e);
		}
	};

	const showMessageErrorActions = (message: TMessageModel) => {
		showActionSheet({
			options: [
				{
					title: I18n.t('Resend'),
					icon: 'send',
					onPress: () => handleResend(message)
				},
				{
					title: I18n.t('Delete'),
					icon: 'delete',
					danger: true,
					onPress: () => handleDelete(message)
				}
			],
			hasCancel: true
		});
	};

	useImperativeHandle(ref, () => ({
		showMessageErrorActions
	}));

	return null;
});

export default MessageErrorActions;
