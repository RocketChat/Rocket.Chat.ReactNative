import React, { forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import { Alert, Clipboard, Share } from 'react-native';
import { connect } from 'react-redux';
import moment from 'moment';

import RocketChat from '../../lib/rocketchat';
import database from '../../lib/database';
import I18n from '../../i18n';
import log from '../../utils/log';
import Navigation from '../../lib/Navigation';
import { getMessageTranslation } from '../message/utils';
import { LISTENER } from '../Toast';
import EventEmitter from '../../utils/events';
import { showConfirmationAlert } from '../../utils/info';
import { useActionSheet } from '../../actionSheet';
import Header from './Header';

const MessageActions = forwardRef(({
	room,
	message,
	tmid,
	user,
	editInit,
	reactionInit,
	onReactionPress,
	replyInit,
	isReadOnly,
	server,
	Message_AllowDeleting,
	Message_AllowDeleting_BlockDeleteInMinutes,
	Message_AllowEditing,
	Message_AllowEditing_BlockEditInMinutes,
	Message_AllowPinning,
	Message_AllowStarring,
	Message_Read_Receipt_Store_Users
}, ref) => {
	let permissions = {};
	const { show, hide } = useActionSheet();

	console.log('message', message);

	const getPermissions = async() => {
		try {
			const permission = ['edit-message', 'delete-message', 'force-delete-message'];
			const result = await RocketChat.hasPermission(permission, room.rid);
			permissions = {
				hasEditPermission: result[permission[0]],
				hasDeletePermission: result[permission[1]],
				hasForceDeletePermission: result[permission[2]]
			};
		} catch {
			// Do nothing
		}
	};

	const isOwn = () => message.u && message.u._id === user.id;

	const allowEdit = () => {
		if (isReadOnly) {
			return false;
		}
		const editOwn = isOwn();

		if (!(permissions.hasEditPermission || (Message_AllowEditing && editOwn))) {
			return false;
		}
		const blockEditInMinutes = Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (message.ts != null) {
				msgTs = moment(message.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	};

	const allowDelete = () => {
		if (isReadOnly) {
			return false;
		}

		// Prevent from deleting thread start message when positioned inside the thread
		if (tmid === message.id) {
			return false;
		}
		const deleteOwn = isOwn();
		if (!(permissions.hasDeletePermission || (Message_AllowDeleting && deleteOwn) || permissions.hasForceDeletePermission)) {
			return false;
		}
		if (permissions.hasForceDeletePermission) {
			return true;
		}
		const blockDeleteInMinutes = Message_AllowDeleting_BlockDeleteInMinutes;
		if (blockDeleteInMinutes != null && blockDeleteInMinutes !== 0) {
			let msgTs;
			if (message.ts != null) {
				msgTs = moment(message.ts);
			}
			let currentTsDiff;
			if (msgTs != null) {
				currentTsDiff = moment().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
	};

	const getPermalink = () => RocketChat.getPermalinkMessage(message);

	const handleReply = () => replyInit(message, true);

	const handleEdit = () => editInit(message);

	const handleCreateDiscussion = () => {
		Navigation.navigate('CreateDiscussionView', { message, channel: room });
	};

	const handleUnread = async() => {
		const { id: messageId, ts } = message;
		const { rid } = room;
		try {
			const db = database.active;
			const result = await RocketChat.markAsUnread({ messageId });
			if (result.success) {
				const subCollection = db.collections.get('subscriptions');
				const subRecord = await subCollection.find(rid);
				await db.action(async() => {
					try {
						await subRecord.update(sub => sub.lastOpen = ts);
					} catch {
						// do nothing
					}
				});
				Navigation.navigate('RoomsListView');
			}
		} catch (e) {
			log(e);
		}
	};

	const handlePermalink = async() => {
		try {
			const permalink = await getPermalink();
			Clipboard.setString(permalink);
			EventEmitter.emit(LISTENER, { message: I18n.t('Permalink_copied_to_clipboard') });
		} catch {
			// Do nothing
		}
	};

	const handleCopy = async() => {
		await Clipboard.setString(message.msg);
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	const handleShare = async() => {
		try {
			const permalink = await getPermalink();
			Share.share({ message: permalink });
		} catch {
			// Do nothing
		}
	};

	const handleQuote = () => replyInit(message, false);

	const handleStar = async() => {
		try {
			await RocketChat.toggleStarMessage(message.id, message.starred);
			EventEmitter.emit(LISTENER, { message: message.starred ? I18n.t('Message_unstarred') : I18n.t('Message_starred') });
		} catch (e) {
			log(e);
		}
	};

	const handlePin = async() => {
		try {
			await RocketChat.togglePinMessage(message.id, message.pinned);
		} catch (e) {
			log(e);
		}
	};

	const handleReaction = (shortname) => {
		if (shortname) {
			onReactionPress(shortname, message.id);
		} else {
			reactionInit(message);
		}
		// close actionSheet when click at header
		hide();
	};

	const handleReadReceipt = () => Navigation.navigate('ReadReceiptsView', { messageId: message.id });

	const handleToggleTranslation = async() => {
		try {
			const db = database.active;
			await db.action(async() => {
				await message.update((m) => {
					m.autoTranslate = !m.autoTranslate;
					m._updatedAt = new Date();
				});
			});
			const translatedMessage = getMessageTranslation(message, room.autoTranslateLanguage);
			if (!translatedMessage) {
				const m = {
					_id: message.id,
					rid: message.subscription.id,
					u: message.u,
					msg: message.msg
				};
				await RocketChat.translateMessage(m, room.autoTranslateLanguage);
			}
		} catch (e) {
			log(e);
		}
	};

	const handleReport = async() => {
		try {
			await RocketChat.reportMessage(message.id);
			Alert.alert(I18n.t('Message_Reported'));
		} catch (e) {
			log(e);
		}
	};

	const handleDelete = () => {
		showConfirmationAlert({
			message: I18n.t('You_will_not_be_able_to_recover_this_message'),
			callToAction: I18n.t('Delete'),
			onPress: async() => {
				try {
					await RocketChat.deleteMessage(message.id, message.subscription.id);
				} catch (e) {
					log(e);
				}
			}
		});
	};

	const getOptions = () => {
		let options = [];

		// Reply
		if (!isReadOnly) {
			options = [{
				title: I18n.t('Reply'),
				icon: 'reply',
				onPress: handleReply
			}];
		}

		// Edit
		if (allowEdit()) {
			options.push({
				title: I18n.t('Edit'),
				icon: 'edit',
				onPress: handleEdit
			});
		}

		// Create Discussion
		options.push({
			title: I18n.t('Create_Discussion'),
			icon: 'discussion',
			onPress: handleCreateDiscussion
		});

		// Mark as unread
		if (message.u && message.u._id !== user.id) {
			options.push({
				title: I18n.t('Mark_unread'),
				icon: 'flag',
				onPress: handleUnread
			});
		}

		// Permalink
		options.push({
			title: I18n.t('Permalink'),
			icon: 'permalink',
			onPress: handlePermalink
		});

		// Copy
		options.push({
			title: I18n.t('Copy'),
			icon: 'copy',
			onPress: handleCopy
		});

		// Share
		options.push({
			title: I18n.t('Share'),
			icon: 'share',
			onPress: handleShare
		});

		// Quote
		if (!isReadOnly) {
			options.push({
				title: I18n.t('Quote'),
				icon: 'quote',
				onPress: handleQuote
			});
		}

		// Star
		if (Message_AllowStarring) {
			options.push({
				title: I18n.t(message.starred ? 'Unstar' : 'Star'),
				icon: 'star',
				onPress: handleStar
			});
		}

		// Pin
		if (Message_AllowPinning) {
			options.push({
				title: I18n.t(message.pinned ? 'Unpin' : 'Pin'),
				icon: 'pin',
				onPress: handlePin
			});
		}

		// Reaction
		if (!isReadOnly || room.reactWhenReadOnly) {
			options.push({
				title: I18n.t('Add_Reaction'),
				icon: 'add-reaction',
				onPress: handleReaction
			});
		}

		// Read Receipts
		if (Message_Read_Receipt_Store_Users) {
			options.push({
				title: I18n.t('Read_Receipt'),
				icon: 'receipt',
				onPress: handleReadReceipt
			});
		}

		// Toggle Auto-translate
		if (room.autoTranslate && message.u && message.u._id !== user.id) {
			options.push({
				title: I18n.t(message.autoTranslate ? 'View_Original' : 'Translate'),
				icon: 'translate',
				onPress: handleToggleTranslation
			});
		}

		// Report
		options.push({
			title: I18n.t('Report'),
			icon: 'report',
			danger: true,
			onPress: handleReport
		});

		// Delete
		if (allowDelete()) {
			options.push({
				title: I18n.t('Delete'),
				icon: 'trash',
				danger: true,
				onPress: handleDelete
			});
		}

		return options;
	};

	const showMessageActions = async() => {
		await getPermissions();
		show({
			options: getOptions(),
			customHeader: (
				<Header
					server={server}
					handleReaction={handleReaction}
				/>
			)
		});
	};

	useImperativeHandle(ref, () => ({ showMessageActions }));
});
MessageActions.propTypes = {
	room: PropTypes.object,
	message: PropTypes.object,
	tmid: PropTypes.string,
	user: PropTypes.object,
	editInit: PropTypes.func,
	reactionInit: PropTypes.func,
	onReactionPress: PropTypes.func,
	replyInit: PropTypes.func,
	isReadOnly: PropTypes.bool,
	Message_AllowDeleting: PropTypes.bool,
	Message_AllowDeleting_BlockDeleteInMinutes: PropTypes.number,
	Message_AllowEditing: PropTypes.bool,
	Message_AllowEditing_BlockEditInMinutes: PropTypes.number,
	Message_AllowPinning: PropTypes.bool,
	Message_AllowStarring: PropTypes.bool,
	Message_Read_Receipt_Store_Users: PropTypes.bool,
	server: PropTypes.string
};

const mapStateToProps = state => ({
	server: state.server.server,
	Message_AllowDeleting: state.settings.Message_AllowDeleting,
	Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes,
	Message_AllowEditing: state.settings.Message_AllowEditing,
	Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes,
	Message_AllowPinning: state.settings.Message_AllowPinning,
	Message_AllowStarring: state.settings.Message_AllowStarring,
	Message_Read_Receipt_Store_Users: state.settings.Message_Read_Receipt_Store_Users
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(MessageActions);
