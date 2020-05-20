import React from 'react';
import PropTypes from 'prop-types';

import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import protectedFunction from '../lib/methods/helpers/protectedFunction';
import { connectActionSheet } from '../actionSheet';
import I18n from '../i18n';
import log from '../utils/log';

class MessageErrorActions extends React.Component {
	static propTypes = {
		showActionSheetWithOptions: PropTypes.func,
		message: PropTypes.object,
		tmid: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.options = [
			{
				title: I18n.t('Delete'),
				icon: 'trash',
				danger: true,
				onPress: this.handleDelete
			},
			{
				title: I18n.t('Resend'),
				icon: 'send',
				onPress: this.handleResend
			}
		];
	}

	handleResend = protectedFunction(async() => {
		const { message, tmid } = this.props;
		await RocketChat.resendMessage(message, tmid);
	});

	handleDelete = async() => {
		try {
			const { message, tmid } = this.props;
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
				} catch (error) {
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
						} catch (error) {
							// Do nothing: thread not found
						}
					} else {
						deleteBatch.push(
							msg.prepareUpdate((m) => {
								m.tcount -= 1;
							})
						);
					}
				} catch (error) {
					// Do nothing: message not found
				}
			}
			await db.action(async() => {
				await db.batch(...deleteBatch);
			});
		} catch (e) {
			log(e);
		}
	}

	showActionSheet = () => {
		const { showActionSheetWithOptions } = this.props;
		showActionSheetWithOptions({ options: this.options });
	}

	render() {
		return (
			null
		);
	}
}

export default connectActionSheet(MessageErrorActions);
