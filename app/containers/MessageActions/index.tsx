import React, { forwardRef, useImperativeHandle } from 'react';
import { Alert, Share } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { connect } from 'react-redux';
import moment from 'moment';

import database from '../../lib/database';
import I18n from '../../i18n';
import log, { logEvent } from '../../lib/methods/helpers/log';
import Navigation from '../../lib/navigation/appNavigation';
import { getMessageTranslation } from '../message/utils';
import { LISTENER } from '../Toast';
import EventEmitter from '../../lib/methods/helpers/events';
import { showConfirmationAlert } from '../../lib/methods/helpers/info';
import { TActionSheetOptionsItem, useActionSheet, ACTION_SHEET_ANIMATION_DURATION } from '../ActionSheet';
import Header, { HEADER_HEIGHT, IHeader } from './Header';
import events from '../../lib/methods/helpers/log/events';
import {
	IAppActionButton,
	IApplicationState,
	IEmoji,
	ILoggedUser,
	MessageActionContext,
	TAnyMessageModel,
	TSubscriptionModel,
	UIActionButtonContext
} from '../../definitions';
import { getPermalinkMessage, getQuoteMessageLink } from '../../lib/methods';
import {
	compareServerVersion,
	getRoomTitle,
	getUidDirectMessage,
	hasPermission,
	hasScopedRole,
	isStarredMessage,
	isThreadMessage,
	isTruthy,
	random
} from '../../lib/methods/helpers';
import { Services } from '../../lib/services';
import { IAppActionButtonsState } from '../../reducers/appActionButtons';
import sdk from '../../lib/services/sdk';

const getMessageContext = (message: TAnyMessageModel): MessageActionContext => {
	if (isThreadMessage(message)) {
		return MessageActionContext.THREADS;
	}

	if (isStarredMessage(message)) {
		return MessageActionContext.STARRED;
	}

	return MessageActionContext.MESSAGE;
};

export interface IMessageActionsProps {
	room: TSubscriptionModel;
	tmid?: string;
	user: Pick<ILoggedUser, 'id'>;
	editInit: (messageId: string) => void;
	reactionInit: (messageId: string) => void;
	onReactionPress: (shortname: IEmoji, messageId: string) => void;
	replyInit: (messageId: string) => void;
	quoteInit: (messageId: string) => void;
	jumpToMessage?: (messageUrl?: string, isFromReply?: boolean) => Promise<void>;
	isMasterDetail: boolean;
	isReadOnly: boolean;
	serverVersion?: string | null;
	Message_AllowDeleting?: boolean;
	Message_AllowDeleting_BlockDeleteInMinutes?: number;
	Message_AllowEditing?: boolean;
	Message_AllowEditing_BlockEditInMinutes?: number;
	Message_AllowPinning?: boolean;
	Message_AllowStarring?: boolean;
	Message_Read_Receipt_Store_Users?: boolean;
	editMessagePermission?: string[];
	deleteMessagePermission?: string[];
	forceDeleteMessagePermission?: string[];
	deleteOwnMessagePermission?: string[];
	pinMessagePermission?: string[];
	createDirectMessagePermission?: string[];
	createDiscussionOtherUserPermission?: string[];
	appActionButtons: IAppActionButtonsState;
}

export interface IMessageActions {
	showMessageActions: (message: TAnyMessageModel) => Promise<void>;
}

const MessageActions = React.memo(
	forwardRef<IMessageActions, IMessageActionsProps>(
		(
			{
				room,
				tmid,
				user,
				editInit,
				reactionInit,
				onReactionPress,
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
				serverVersion,
				appActionButtons
			},
			ref
		) => {
			let permissions = {
				hasEditPermission: false,
				hasDeletePermission: false,
				hasForceDeletePermission: false,
				hasPinPermission: false,
				hasDeleteOwnPermission: false,
				hasCreateDirectMessagePermission: false,
				hasCreateDiscussionOtherUserPermission: false
			};
			const { showActionSheet, hideActionSheet } = useActionSheet();

			const getPermissions = async () => {
				try {
					const permission = [
						editMessagePermission,
						deleteMessagePermission,
						forceDeleteMessagePermission,
						pinMessagePermission,
						deleteOwnMessagePermission,
						createDirectMessagePermission,
						createDiscussionOtherUserPermission
					];
					const result = await hasPermission(permission, room.rid);
					permissions = {
						hasEditPermission: result[0],
						hasDeletePermission: result[1],
						hasForceDeletePermission: result[2],
						hasPinPermission: result[3],
						hasDeleteOwnPermission: result[4],
						hasCreateDirectMessagePermission: result[5],
						hasCreateDiscussionOtherUserPermission: result[6]
					};
				} catch {
					// Do nothing
				}
			};

			const isOwn = (message: TAnyMessageModel) => message.u && message.u._id === user.id;

			const allowEdit = (message: TAnyMessageModel) => {
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
						msgTs = moment(message.ts);
					}
					let currentTsDiff = 0;
					if (msgTs != null) {
						currentTsDiff = moment().diff(msgTs, 'minutes');
					}
					return currentTsDiff < blockEditInMinutes;
				}
				return true;
			};

			const allowDelete = (message: TAnyMessageModel) => {
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
						msgTs = moment(message.ts);
					}
					let currentTsDiff = 0;
					if (msgTs != null) {
						currentTsDiff = moment().diff(msgTs, 'minutes');
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
				const params = { message, channel: room, showCloseModal: true };
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
				const { rid } = room;
				try {
					const db = database.active;
					const result = await Services.markAsUnread({ messageId });
					if (result.success) {
						const subCollection = db.get('subscriptions');
						const subRecord = await subCollection.find(rid);
						await db.write(async () => {
							try {
								await subRecord.update(sub => (sub.lastOpen = ts as Date)); // TODO: reevaluate IMessage
							} catch {
								// do nothing
							}
						});
						Navigation.navigate('RoomsListView');
					}
				} catch (e) {
					logEvent(events.ROOM_MSG_ACTION_UNREAD_F);
					log(e);
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
					const result = await Services.createDirectMessage(message.u.username);
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

			const handleStar = async (message: TAnyMessageModel) => {
				logEvent(message.starred ? events.ROOM_MSG_ACTION_UNSTAR : events.ROOM_MSG_ACTION_STAR);
				try {
					await Services.toggleStarMessage(message.id, message.starred as boolean); // TODO: reevaluate `message.starred` type on IMessage
					EventEmitter.emit(LISTENER, { message: message.starred ? I18n.t('Message_unstarred') : I18n.t('Message_starred') });
				} catch (e) {
					logEvent(events.ROOM_MSG_ACTION_STAR_F);
					log(e);
				}
			};

			const handlePin = async (message: TAnyMessageModel) => {
				logEvent(events.ROOM_MSG_ACTION_PIN);
				try {
					await Services.togglePinMessage(message.id, message.pinned as boolean); // TODO: reevaluate `message.pinned` type on IMessage
				} catch (e) {
					logEvent(events.ROOM_MSG_ACTION_PIN_F);
					log(e);
				}
			};

			const handleReaction: IHeader['handleReaction'] = (emoji, message) => {
				logEvent(events.ROOM_MSG_ACTION_REACTION);
				if (emoji) {
					onReactionPress(emoji, message.id);
				} else {
					setTimeout(() => reactionInit(message.id), ACTION_SHEET_ANIMATION_DURATION);
				}
				hideActionSheet();
			};

			const handleReadReceipt = (message: TAnyMessageModel) => {
				if (isMasterDetail) {
					Navigation.navigate('ModalStackNavigator', { screen: 'ReadReceiptsView', params: { messageId: message.id } });
				} else {
					Navigation.navigate('ReadReceiptsView', { messageId: message.id });
				}
			};

			const handleToggleTranslation = async (message: TAnyMessageModel) => {
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
						await Services.translateMessage(message.id, room.autoTranslateLanguage);
					}
				} catch (e) {
					log(e);
				}
			};

			const handleReport = async (message: TAnyMessageModel) => {
				logEvent(events.ROOM_MSG_ACTION_REPORT);
				try {
					await Services.reportMessage(message.id);
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
							await Services.deleteMessage(message.id, message.subscription ? message.subscription.id : '');
						} catch (e) {
							logEvent(events.ROOM_MSG_ACTION_DELETE_F);
							log(e);
						}
					}
				});
			};

			const handleAppActionButtonPress = (appActionButton: IAppActionButton, message: TAnyMessageModel) => {
				const params = {
					type: 'actionButton',
					triggerId: random(17),
					actionId: appActionButton.actionId,
					payload: { context: appActionButton.context },
					rid: room.rid,
					tmid: message?.tmid,
					mid: message._id
				} as const;

				sdk.post(`ui.interaction/${appActionButton.appId}`, params, 'apps');
			};

			const getMessageAppActionButtons = (appActionButtons: IAppActionButton[]) =>
				appActionButtons.filter(action => action.context === UIActionButtonContext.MESSAGE_ACTION);

			// TODO: Implement room context filter
			const filterByMessageContext = async (
				appActionButtons: IAppActionButton[],
				message: TAnyMessageModel
			): Promise<IAppActionButton[]> => {
				const filteredByMessageActionContextButtons = appActionButtons.filter(action => {
					if (!action.when?.messageActionContext) {
						return true;
					}

					const messageContext = getMessageContext(message);
					return action.when.messageActionContext.includes(messageContext);
				});

				return (
					await Promise.all(
						filteredByMessageActionContextButtons.map(async action => {
							if (!action.when) {
								return action;
							}

							const { hasAllPermissions, hasAllRoles, hasOnePermission, hasOneRole } = action.when;

							const hasAllPermissionsResult = hasAllPermissions
								? (await hasPermission(hasAllPermissions, room.rid)).every(perm => perm === true)
								: true;
							const hasOnePermissionResult = hasOnePermission
								? (await hasPermission(hasOnePermission, room.rid)).some(perm => perm === true)
								: true;
							const hasOneRoleResult = hasOneRole
								? (await Promise.all(hasOneRole.map(role => hasScopedRole(role, room.rid)))).some(role => role === true)
								: true;
							const hasAllRolesResult = hasAllRoles
								? (await Promise.all(hasAllRoles.map(role => hasScopedRole(role, room.rid)))).every(role => role === true)
								: true;

							if (!hasOnePermissionResult || !hasAllPermissionsResult || !hasOneRoleResult || !hasAllRolesResult) {
								return;
							}

							return action;
						})
					)
				).filter(isTruthy);
			};

			const getAppActionButtons = async (message: TAnyMessageModel) => {
				const parsedAppActionButtons = Object.values(appActionButtons);

				const messageActionButtons = getMessageAppActionButtons(parsedAppActionButtons);
				const actionButtons = await filterByMessageContext(messageActionButtons, message);

				return actionButtons.map(action => ({
					title: action.labelI18n,
					onPress: () => handleAppActionButtonPress(action, message),
					icon: 'phone'
				}));
			};

			const getOptions = (message: TAnyMessageModel) => {
				const options: TActionSheetOptionsItem[] = [];
				const videoConfBlock = message.t === 'videoconf';

				// Edit
				const isEditAllowed = allowEdit(message);
				if (!videoConfBlock && (isOwn(message) || isEditAllowed)) {
					options.push({
						title: I18n.t('Edit'),
						icon: 'edit',
						onPress: () => handleEdit(message.id),
						enabled: isEditAllowed
					});
				}

				// Jump to message
				const quoteMessageLink = getQuoteMessageLink(message.attachments);
				if (quoteMessageLink && jumpToMessage) {
					options.push({
						title: I18n.t('Jump_to_message'),
						icon: 'jump-to-message',
						onPress: () => jumpToMessage(quoteMessageLink, true)
					});
				}

				// Quote
				if (!isReadOnly && !videoConfBlock) {
					options.push({
						title: I18n.t('Quote'),
						icon: 'quote',
						onPress: () => handleQuote(message.id)
					});
				}

				// Reply
				if (!isReadOnly && !tmid) {
					options.push({
						title: I18n.t('Reply_in_Thread'),
						icon: 'threads',
						onPress: () => handleReply(message.id)
					});
				}

				// Reply in DM
				if (room.t !== 'd' && room.t !== 'l' && !videoConfBlock) {
					options.push({
						title: I18n.t('Reply_in_direct_message'),
						icon: 'arrow-back',
						onPress: () => handleReplyInDM(message),
						enabled: permissions.hasCreateDirectMessagePermission
					});
				}

				// Create Discussion
				options.push({
					title: I18n.t('Start_a_Discussion'),
					icon: 'discussions',
					onPress: () => handleCreateDiscussion(message),
					enabled: permissions.hasCreateDiscussionOtherUserPermission
				});

				if (compareServerVersion(serverVersion, 'greaterThanOrEqualTo', '6.2.0') && !videoConfBlock) {
					options.push({
						title: I18n.t('Forward'),
						icon: 'arrow-forward',
						onPress: () => handleShareMessage(message)
					});
				}

				// Permalink
				options.push({
					title: I18n.t('Get_link'),
					icon: 'link',
					onPress: () => handlePermalink(message)
				});

				// Copy
				if (!videoConfBlock) {
					options.push({
						title: I18n.t('Copy'),
						icon: 'copy',
						onPress: () => handleCopy(message)
					});
				}

				// Share
				options.push({
					title: I18n.t('Share'),
					icon: 'share',
					onPress: () => handleShare(message)
				});

				// Pin
				if (Message_AllowPinning && !videoConfBlock) {
					options.push({
						title: I18n.t(message.pinned ? 'Unpin' : 'Pin'),
						icon: 'pin',
						onPress: () => handlePin(message),
						enabled: permissions?.hasPinPermission
					});
				}

				// Star
				if (Message_AllowStarring && !videoConfBlock) {
					options.push({
						title: I18n.t(message.starred ? 'Unstar' : 'Star'),
						icon: message.starred ? 'star-filled' : 'star',
						onPress: () => handleStar(message)
					});
				}

				// Mark as unread
				if (message.u && message.u._id !== user.id) {
					options.push({
						title: I18n.t('Mark_unread'),
						icon: 'flag',
						onPress: () => handleUnread(message)
					});
				}

				// Read Receipts
				if (Message_Read_Receipt_Store_Users) {
					options.push({
						title: I18n.t('Read_Receipt'),
						icon: 'info',
						onPress: () => handleReadReceipt(message)
					});
				}

				// Toggle Auto-translate
				if (room.autoTranslate && message.u && message.u._id !== user.id) {
					options.push({
						title: I18n.t(message.autoTranslate !== false ? 'View_Original' : 'Translate'),
						icon: 'language',
						onPress: () => handleToggleTranslation(message)
					});
				}

				// Report
				options.push({
					title: I18n.t('Report'),
					icon: 'warning',
					danger: true,
					onPress: () => handleReport(message)
				});

				// Delete
				const isDeleteAllowed = allowDelete(message);
				if (isOwn(message) || isDeleteAllowed) {
					options.push({
						title: I18n.t('Delete'),
						icon: 'delete',
						danger: true,
						onPress: () => handleDelete(message),
						enabled: isDeleteAllowed
					});
				}

				return options;
			};

			const showMessageActions = async (message: TAnyMessageModel) => {
				logEvent(events.ROOM_SHOW_MSG_ACTIONS);
				await getPermissions();
				const appActionOptions = (await getAppActionButtons(message)) as TActionSheetOptionsItem[];
				showActionSheet({
					options: [...getOptions(message), ...appActionOptions],
					headerHeight: HEADER_HEIGHT,
					customHeader: (
						<>
							{!isReadOnly || room.reactWhenReadOnly ? (
								<Header handleReaction={handleReaction} isMasterDetail={isMasterDetail} message={message} />
							) : null}
						</>
					)
					// children: <><Text>test</Text></>,
				});
			};

			useImperativeHandle(ref, () => ({ showMessageActions }));

			return null;
		}
	)
);
const mapStateToProps = (state: IApplicationState) => ({
	server: state.server.server,
	serverVersion: state.server.version,
	Message_AllowDeleting: state.settings.Message_AllowDeleting as boolean,
	Message_AllowDeleting_BlockDeleteInMinutes: state.settings.Message_AllowDeleting_BlockDeleteInMinutes as number,
	Message_AllowEditing: state.settings.Message_AllowEditing as boolean,
	Message_AllowEditing_BlockEditInMinutes: state.settings.Message_AllowEditing_BlockEditInMinutes as number,
	Message_AllowPinning: state.settings.Message_AllowPinning as boolean,
	Message_AllowStarring: state.settings.Message_AllowStarring as boolean,
	Message_Read_Receipt_Store_Users: state.settings.Message_Read_Receipt_Store_Users as boolean,
	isMasterDetail: state.app.isMasterDetail,
	editMessagePermission: state.permissions['edit-message'],
	deleteMessagePermission: state.permissions['delete-message'],
	deleteOwnMessagePermission: state.permissions['delete-own-message'],
	forceDeleteMessagePermission: state.permissions['force-delete-message'],
	pinMessagePermission: state.permissions['pin-message'],
	createDirectMessagePermission: state.permissions['create-d'],
	createDiscussionOtherUserPermission: state.permissions['start-discussion-other-user'],
	appActionButtons: state.appActionButtons
});

export default connect(mapStateToProps, null, null, { forwardRef: true })(MessageActions);
