import { useEffect, useState } from 'react';
import { Alert, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import dayjs from '~/lib/dayjs';
import database from '~/lib/database';
import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import I18n from '~/i18n';
import log, { logEvent } from '~/lib/methods/helpers/log';
import Navigation from '~/lib/navigation/appNavigation';
import { getMessageTranslation } from '../message/utils';
import { LISTENER } from '../Toast';
import EventEmitter from '~/lib/methods/helpers/events';
import { showConfirmationAlert } from '~/lib/methods/helpers/info';
import { type TActionSheetOptionsItem } from '../ActionSheet';
import events from '~/lib/methods/helpers/log/events';
import { type TAnyMessageModel } from '~/definitions';
import { getPermalinkMessage } from '~/lib/methods/getPermalinks';
import { getQuoteMessageLink } from '~/lib/methods/getQuoteMessageLink';
import { compareServerVersion, getRoomTitle, getUidDirectMessage, hasPermission } from '~/lib/methods/helpers';
import {
	deleteMessage,
	markAsUnread,
	toggleStarMessage,
	togglePinMessage,
	translateMessage,
	reportMessage
} from '~/lib/services/restApi';
import { createDirectMessage } from '~/lib/methods/createDirectMessage';
import { type IMessageActionsProps } from '.';

export interface IMessageActionPermissions {
	hasEditPermission: boolean;
	hasDeletePermission: boolean;
	hasForceDeletePermission: boolean;
	hasPinPermission: boolean;
	hasDeleteOwnPermission: boolean;
	hasCreateDirectMessagePermission: boolean;
	hasCreateDiscussionOtherUserPermission: boolean;
}

export const DEFAULT_MESSAGE_ACTION_PERMISSIONS: IMessageActionPermissions = {
	hasEditPermission: false,
	hasDeletePermission: false,
	hasForceDeletePermission: false,
	hasPinPermission: false,
	hasDeleteOwnPermission: false,
	hasCreateDirectMessagePermission: false,
	hasCreateDiscussionOtherUserPermission: false
};

const loadPermissions = async (permissionList: (string[] | undefined)[], rid: string): Promise<IMessageActionPermissions> => {
	try {
		const result = await hasPermission(permissionList, rid);
		return {
			hasEditPermission: result[0],
			hasDeletePermission: result[1],
			hasForceDeletePermission: result[2],
			hasPinPermission: result[3],
			hasDeleteOwnPermission: result[4],
			hasCreateDirectMessagePermission: result[5],
			hasCreateDiscussionOtherUserPermission: result[6]
		};
	} catch {
		return DEFAULT_MESSAGE_ACTION_PERMISSIONS;
	}
};

export const useMessageActionPermissions = (permissionList: (string[] | undefined)[], rid: string): IMessageActionPermissions => {
	const [permissions, setPermissions] = useState(DEFAULT_MESSAGE_ACTION_PERMISSIONS);
	const [
		editMessagePermission,
		deleteMessagePermission,
		forceDeleteMessagePermission,
		pinMessagePermission,
		deleteOwnMessagePermission,
		createDirectMessagePermission,
		createDiscussionOtherUserPermission
	] = permissionList;

	useEffect(() => {
		let active = true;
		loadPermissions(
			[
				editMessagePermission,
				deleteMessagePermission,
				forceDeleteMessagePermission,
				pinMessagePermission,
				deleteOwnMessagePermission,
				createDirectMessagePermission,
				createDiscussionOtherUserPermission
			],
			rid
		).then(loaded => {
			if (active) {
				setPermissions(loaded);
			}
		});
		return () => {
			active = false;
		};
	}, [
		editMessagePermission,
		deleteMessagePermission,
		forceDeleteMessagePermission,
		pinMessagePermission,
		deleteOwnMessagePermission,
		createDirectMessagePermission,
		createDiscussionOtherUserPermission,
		rid
	]);

	return permissions;
};

const isVideoConf = (message: TAnyMessageModel) => message.t === 'videoconf';

export const useMessageActionOptions = ({
	getRoom,
	tmid,
	user,
	editInit,
	replyInit,
	quoteInit,
	jumpToMessage,
	isReadOnly,
	Message_AllowDeleting,
	Message_AllowDeleting_BlockDeleteInMinutes,
	Message_AllowEditing,
	Message_AllowEditing_BlockEditInMinutes,
	Message_AllowPinning,
	Message_AllowStarring,
	Message_Read_Receipt_Store_Users,
	isMasterDetail,
	editMessagePermission,
	deleteMessagePermission,
	forceDeleteMessagePermission,
	deleteOwnMessagePermission,
	pinMessagePermission,
	createDirectMessagePermission,
	createDiscussionOtherUserPermission,
	serverVersion
}: Omit<IMessageActionsProps, 'reactionInit' | 'onReactionPress'>) => {
	const permissionList = [
		editMessagePermission,
		deleteMessagePermission,
		forceDeleteMessagePermission,
		pinMessagePermission,
		deleteOwnMessagePermission,
		createDirectMessagePermission,
		createDiscussionOtherUserPermission
	];
	const getPermissions = () => loadPermissions(permissionList, getRoom().rid);

	const isOwn = (message: TAnyMessageModel) => message.u && message.u._id === user.id;

	const allowEdit = (message: TAnyMessageModel, permissions: IMessageActionPermissions) => {
		if (isReadOnly) {
			return false;
		}
		const editOwn = isOwn(message);

		if (!(permissions.hasEditPermission || (Message_AllowEditing !== false && editOwn))) {
			return false;
		}
		const blockEditInMinutes = Message_AllowEditing_BlockEditInMinutes;
		if (blockEditInMinutes) {
			let msgTs;
			if (message.ts != null) {
				msgTs = dayjs(message.ts);
			}
			let currentTsDiff = 0;
			if (msgTs != null) {
				currentTsDiff = dayjs().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockEditInMinutes;
		}
		return true;
	};

	const allowDelete = (message: TAnyMessageModel, permissions: IMessageActionPermissions) => {
		if (isReadOnly) {
			return false;
		}

		// Prevent from deleting thread start message when positioned inside the thread
		if (tmid === message.id) {
			return false;
		}
		const deleteOwn = isOwn(message) && permissions.hasDeleteOwnPermission;
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
				msgTs = dayjs(message.ts);
			}
			let currentTsDiff = 0;
			if (msgTs != null) {
				currentTsDiff = dayjs().diff(msgTs, 'minutes');
			}
			return currentTsDiff < blockDeleteInMinutes;
		}
		return true;
	};

	const getPermalink = (message: TAnyMessageModel) => getPermalinkMessage(message);

	const handleReply = (messageId: string) => {
		logEvent(events.ROOM_MSG_ACTION_REPLY);
		replyInit(messageId);
	};

	const handleEdit = (messageId: string) => {
		logEvent(events.ROOM_MSG_ACTION_EDIT);
		editInit(messageId);
	};

	const handleCreateDiscussion = (message: TAnyMessageModel) => {
		logEvent(events.ROOM_MSG_ACTION_DISCUSSION);
		const params = { message, channel: getRoom(), showCloseModal: true };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
		}
	};

	const handleShareMessage = (message: TAnyMessageModel) => {
		const params = { message };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'ForwardMessageView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'ForwardMessageView', params });
		}
	};

	const handleUnread = async (message: TAnyMessageModel) => {
		logEvent(events.ROOM_MSG_ACTION_UNREAD);
		const { id: messageId, ts } = message;
		const { rid } = getRoom();
		try {
			const db = database.active;
			const result = await markAsUnread({ messageId });
			if (result.success) {
				const subRecord = await getSubscriptionByRoomId(rid);
				if (!subRecord) {
					return;
				}

				await db.write(async () => {
					try {
						await subRecord.update(sub => (sub.ls = ts as Date));
					} catch {
						// do nothing
					}
				});
			}
		} catch (e) {
			log(e);
		} finally {
			Navigation.popToTop(isMasterDetail);
		}
	};

	const handlePermalink = async (message: TAnyMessageModel) => {
		logEvent(events.ROOM_MSG_ACTION_PERMALINK);
		try {
			const permalink = await getPermalink(message);
			Clipboard.setString(permalink ?? '');
			EventEmitter.emit(LISTENER, { message: I18n.t('Permalink_copied_to_clipboard') });
		} catch {
			logEvent(events.ROOM_MSG_ACTION_PERMALINK_F);
		}
	};

	const handleCopy = async (message: TAnyMessageModel) => {
		logEvent(events.ROOM_MSG_ACTION_COPY);
		await Clipboard.setString((message?.attachments?.[0]?.description || message.msg) ?? '');
		EventEmitter.emit(LISTENER, { message: I18n.t('Copied_to_clipboard') });
	};

	const handleShare = async (message: TAnyMessageModel) => {
		logEvent(events.ROOM_MSG_ACTION_SHARE);
		try {
			const permalink = await getPermalink(message);
			if (permalink) {
				Share.share({ message: permalink });
			}
		} catch {
			logEvent(events.ROOM_MSG_ACTION_SHARE_F);
		}
	};

	const handleQuote = (messageId: string) => {
		logEvent(events.ROOM_MSG_ACTION_QUOTE);
		quoteInit(messageId);
	};

	const handleReplyInDM = async (message: TAnyMessageModel) => {
		if (message?.u?.username) {
			const result = await createDirectMessage(message.u.username);
			if (result.success) {
				const { room } = result;
				const params = {
					rid: room.rid,
					name: getRoomTitle(room),
					t: room.t,
					roomUserId: getUidDirectMessage(room),
					messageId: message.id
				};
				Navigation.replace('RoomView', params);
			}
		}
	};

	const handleStar = async (messageId: string, starred: boolean) => {
		logEvent(starred ? events.ROOM_MSG_ACTION_UNSTAR : events.ROOM_MSG_ACTION_STAR);
		try {
			await toggleStarMessage(messageId, starred);
			EventEmitter.emit(LISTENER, { message: starred ? I18n.t('Message_unstarred') : I18n.t('Message_starred') });
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_STAR_F);
			log(e);
		}
	};

	const handlePin = async (message: TAnyMessageModel) => {
		logEvent(events.ROOM_MSG_ACTION_PIN);
		try {
			await togglePinMessage(message.id, message.pinned as boolean); // TODO: reevaluate `message.pinned` type on IMessage
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_PIN_F);
			log(e);
		}
	};

	const handleReadReceipt = (message: TAnyMessageModel) => {
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'ReadReceiptsView', params: { messageId: message.id } });
		} else {
			Navigation.navigate('ReadReceiptsView', { messageId: message.id });
		}
	};

	const handleToggleTranslation = async (message: TAnyMessageModel) => {
		const room = getRoom();
		try {
			if (!room.autoTranslateLanguage) {
				return;
			}
			const db = database.active;
			await db.write(async () => {
				await message.update(m => {
					m.autoTranslate = m.autoTranslate !== null ? !m.autoTranslate : false;
					m._updatedAt = new Date();
				});
			});
			const translatedMessage = getMessageTranslation(message, room.autoTranslateLanguage);
			if (!translatedMessage) {
				await translateMessage(message.id, room.autoTranslateLanguage);
			}
		} catch (e) {
			log(e);
		}
	};

	const handleReport = async (message: TAnyMessageModel) => {
		logEvent(events.ROOM_MSG_ACTION_REPORT);
		try {
			await reportMessage(message.id);
			Alert.alert(I18n.t('Message_Reported'));
		} catch (e) {
			logEvent(events.ROOM_MSG_ACTION_REPORT_F);
			log(e);
		}
	};

	const handleDelete = (message: TAnyMessageModel) => {
		showConfirmationAlert({
			message: I18n.t('You_will_not_be_able_to_recover_this_message'),
			confirmationText: I18n.t('Delete'),
			onPress: async () => {
				try {
					logEvent(events.ROOM_MSG_ACTION_DELETE);
					await deleteMessage(message.id, message.subscription ? message.subscription.id : '');
				} catch (e) {
					logEvent(events.ROOM_MSG_ACTION_DELETE_F);
					log(e);
				}
			}
		});
	};

	const getConversationOptions = (message: TAnyMessageModel, permissions: IMessageActionPermissions) => {
		const room = getRoom();
		const options: TActionSheetOptionsItem[] = [];
		const videoConfBlock = isVideoConf(message);

		// Edit
		const isEditAllowed = allowEdit(message, permissions);
		if (!videoConfBlock && (isOwn(message) || isEditAllowed)) {
			options.push({
				title: I18n.t('Edit'),
				icon: 'edit',
				onPress: () => handleEdit(message.id),
				enabled: isEditAllowed,
				testID: 'message-actions-edit'
			});
		}

		// Jump to message
		const quoteMessageLink = getQuoteMessageLink(message.attachments);
		if (quoteMessageLink && jumpToMessage) {
			options.push({
				title: I18n.t('Jump_to_message'),
				icon: 'jump-to-message',
				onPress: () => jumpToMessage(quoteMessageLink, true),
				testID: 'message-actions-jump-to-message'
			});
		}

		// Quote
		if (!isReadOnly && !videoConfBlock) {
			options.push({
				title: I18n.t('Quote'),
				icon: 'quote',
				onPress: () => handleQuote(message.id),
				testID: 'message-actions-quote'
			});
		}

		// Reply
		if (!isReadOnly && !tmid) {
			options.push({
				title: I18n.t('Reply_in_Thread'),
				icon: 'threads',
				onPress: () => handleReply(message.id),
				testID: 'message-actions-reply-in-thread'
			});
		}

		// Reply in DM
		if (room.t !== 'd' && room.t !== 'l' && !videoConfBlock) {
			options.push({
				title: I18n.t('Reply_in_direct_message'),
				icon: 'arrow-back',
				onPress: () => handleReplyInDM(message),
				enabled: permissions.hasCreateDirectMessagePermission && !room.abacAttributes,
				disabledReason: room.abacAttributes && I18n.t('ABAC_disabled_action_reason'),
				testID: 'message-actions-reply-in-dm'
			});
		}

		// Create Discussion
		options.push({
			title: I18n.t('Start_a_Discussion'),
			icon: 'discussions',
			onPress: () => handleCreateDiscussion(message),
			enabled: permissions.hasCreateDiscussionOtherUserPermission,
			testID: 'message-actions-create-discussion'
		});

		return options;
	};

	const getSharingOptions = (message: TAnyMessageModel) => {
		const room = getRoom();
		const options: TActionSheetOptionsItem[] = [];
		const videoConfBlock = isVideoConf(message);

		// Forward
		if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.2.0') && !videoConfBlock) {
			options.push({
				title: I18n.t('Forward'),
				icon: 'arrow-forward',
				onPress: () => handleShareMessage(message),
				enabled: !room.abacAttributes,
				disabledReason: room.abacAttributes && I18n.t('ABAC_disabled_action_reason'),
				testID: 'message-actions-forward'
			});
		}

		// Get link
		options.push({
			title: I18n.t('Get_link'),
			icon: 'link',
			onPress: () => handlePermalink(message),
			enabled: !room.abacAttributes,
			disabledReason: room.abacAttributes && I18n.t('ABAC_disabled_action_reason'),
			testID: 'message-actions-get-link'
		});

		// Copy
		if (!videoConfBlock) {
			options.push({
				title: I18n.t('Copy'),
				icon: 'copy',
				onPress: () => handleCopy(message),
				testID: 'message-actions-copy'
			});
		}

		// Share
		options.push({
			title: I18n.t('Share'),
			icon: 'share',
			onPress: () => handleShare(message),
			testID: 'message-actions-share'
		});

		return options;
	};

	const getMessageStateOptions = (message: TAnyMessageModel, permissions: IMessageActionPermissions) => {
		const options: TActionSheetOptionsItem[] = [];
		const videoConfBlock = isVideoConf(message);
		const isFromAnotherUser = !!message.u && message.u._id !== user.id;

		// Pin
		if (Message_AllowPinning && !videoConfBlock) {
			options.push({
				title: I18n.t(message.pinned ? 'Unpin' : 'Pin'),
				icon: 'pin',
				onPress: () => handlePin(message),
				enabled: permissions?.hasPinPermission,
				testID: `message-actions-${message.pinned ? 'unpin' : 'pin'}`
			});
		}

		// Star
		if (Message_AllowStarring && !videoConfBlock) {
			options.push({
				title: I18n.t(message.starred ? 'Unstar' : 'Star'),
				icon: message.starred ? 'star-filled' : 'star',
				onPress: () => handleStar(message.id, message.starred || false),
				testID: `message-actions-${message.starred ? 'unstar' : 'star'}`
			});
		}

		// Mark as unread
		if (isFromAnotherUser) {
			options.push({
				title: I18n.t('Mark_unread'),
				icon: 'flag',
				onPress: () => handleUnread(message),
				testID: 'message-actions-mark-unread'
			});
		}

		// Read Receipts
		if (Message_Read_Receipt_Store_Users) {
			options.push({
				title: I18n.t('Read_Receipt'),
				icon: 'info',
				onPress: () => handleReadReceipt(message),
				testID: 'message-actions-read-receipt'
			});
		}

		// Toggle Auto-translate
		if (getRoom().autoTranslate && isFromAnotherUser) {
			options.push({
				title: I18n.t(message.autoTranslate !== false ? 'View_Original' : 'Translate'),
				icon: 'language',
				onPress: () => handleToggleTranslation(message),
				testID: 'message-actions-toggle-translation'
			});
		}

		return options;
	};

	const getModerationOptions = (message: TAnyMessageModel, permissions: IMessageActionPermissions) => {
		const options: TActionSheetOptionsItem[] = [];

		// Report
		options.push({
			title: I18n.t('Report'),
			icon: 'warning',
			danger: true,
			onPress: () => handleReport(message),
			testID: 'message-actions-report'
		});

		// Delete
		const isDeleteAllowed = allowDelete(message, permissions);
		if (isOwn(message) || isDeleteAllowed) {
			options.push({
				title: I18n.t('Delete'),
				icon: 'delete',
				danger: true,
				onPress: () => handleDelete(message),
				enabled: isDeleteAllowed,
				testID: 'message-actions-delete'
			});
		}

		return options;
	};

	const getOptions = (message: TAnyMessageModel, permissions: IMessageActionPermissions): TActionSheetOptionsItem[] => [
		...getConversationOptions(message, permissions),
		...getSharingOptions(message),
		...getMessageStateOptions(message, permissions),
		...getModerationOptions(message, permissions)
	];

	return { getPermissions, getOptions, permissionList };
};
