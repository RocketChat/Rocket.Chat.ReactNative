import { useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import protectedFunction from '../lib/methods/helpers/protectedFunction';
import { useActionSheet } from './ActionSheet';
import I18n from '../i18n';
import log from '../utils/log';

const MessageErrorActions = forwardRef(({ tmid }, ref) => {
	const { showActionSheet } = useActionSheet();

	const handleResend = protectedFunction(async(message) => {
		await RocketChat.resendMessage(message, tmid);
	});

	const handleDelete = async(message) => {
		try {
			const db = database.active;
			const deleteBatch = [];
			const msgCollection = db.collections.get('messages');
			const threadCollection = db.collections.get('threads');

			// Delete the object (it can be Message or ThreadMessage instance)
			deleteBatch.push(message.prepareDestroyPermanently());

			// If it's a thread, we find and delete the whole tree, if necessary
			if (tmid) {
				try {
					const msg = await msgCollection.find(message.id);
					deleteBatch.push(msg.prepareDestroyPermanently());
				} catch {
					// Do nothing: message not found
				}

				try {
					// Find the thread header and update it
					const msg = await msgCollection.find(tmid);
					if (msg.tcount <= 1) {
						deleteBatch.push(
							msg.prepareUpdate((m) => {
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
							msg.prepareUpdate((m) => {
								m.tcount -= 1;
							})
						);
					}
				} catch {
					// Do nothing: message not found
				}
			}
			await db.action(async() => {
				await db.batch(...deleteBatch);
			});
		} catch (e) {
			log(e);
		}
	};

	const showMessageErrorActions = (message) => {
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
});
MessageErrorActions.propTypes = {
	message: PropTypes.object,
	tmid: PropTypes.string
};

export default MessageErrorActions;
