/* eslint-disable complexity */
import { TMessageModel } from '../../definitions/IMessage';
import I18n from '../../i18n';
import { DISCUSSION } from './constants';

export const formatMessageCount = (count?: number, type?: string): string | null => {
	const discussion = type === DISCUSSION;
	let text = discussion ? I18n.t('No_messages_yet') : null;
	if (!count) {
		return text;
	}
	if (count === 1) {
		text = `${count} ${discussion ? I18n.t('message') : I18n.t('reply')}`;
	} else if (count > 1 && count < 1000) {
		text = `${count} ${discussion ? I18n.t('messages') : I18n.t('replies')}`;
	} else if (count > 999) {
		text = `+999 ${discussion ? I18n.t('messages') : I18n.t('replies')}`;
	}
	return text;
};

export const BUTTON_HIT_SLOP = {
	top: 4,
	right: 4,
	bottom: 4,
	left: 4
};

export const SYSTEM_MESSAGES = [
	'r',
	'au',
	'ru',
	'ul',
	'ult',
	'uj',
	'ujt',
	'ut',
	'rm',
	'user-muted',
	'user-unmuted',
	'message_pinned',
	'subscription-role-added',
	'subscription-role-removed',
	'room_changed_description',
	'room_changed_announcement',
	'room_changed_topic',
	'room_changed_privacy',
	'room_changed_avatar',
	'message_snippeted',
	'thread-created',
	'room_e2e_enabled',
	'room_e2e_disabled',
	'removed-user-from-team',
	'added-user-to-team',
	'user-added-room-to-team',
	'user-converted-to-team',
	'user-converted-to-channel',
	'user-deleted-room-from-team',
	'user-removed-room-from-team',
	'room-disallowed-reacting',
	'room-allowed-reacting',
	'room-set-read-only',
	'room-removed-read-only',
	'omnichannel_placed_chat_on_hold',
	'omnichannel_on_hold_chat_resumed'
];

export const IGNORED_LIVECHAT_SYSTEM_MESSAGES = [
	'livechat_navigation_history',
	'livechat_transcript_history',
	'livechat_transfer_history',
	'command',
	'livechat-close',
	'livechat-started',
	'livechat_video_call',
	'livechat_webrtc_video_call'
];

export const SYSTEM_MESSAGE_TYPES = {
	MESSAGE_REMOVED: 'rm',
	MESSAGE_PINNED: 'message_pinned',
	MESSAGE_SNIPPETED: 'message_snippeted',
	USER_JOINED_CHANNEL: 'uj',
	USER_JOINED_TEAM: 'ujt',
	USER_JOINED_DISCUSSION: 'ut',
	USER_LEFT_CHANNEL: 'ul',
	USER_LEFT_TEAM: 'ult',
	REMOVED_USER_FROM_TEAM: 'removed-user-from-team',
	ADDED_USER_TO_TEAM: 'added-user-to-team',
	ADDED_ROOM_TO_TEAM: 'user-added-room-to-team',
	CONVERTED_TO_TEAM: 'user-converted-to-team',
	CONVERTED_TO_CHANNEL: 'user-converted-to-channel',
	DELETED_ROOM_FROM_TEAM: 'user-deleted-room-from-team',
	REMOVED_ROOM_FROM_TEAM: 'user-removed-room-from-team',
	OMNICHANNEL_PLACED_CHAT_ON_HOLD: 'omnichannel_placed_chat_on_hold',
	OMNICHANNEL_ON_HOLD_CHAT_RESUMED: 'omnichannel_on_hold_chat_resumed',
	LIVECHAT_NAVIGATION_HISTORY: 'livechat_navigation_history',
	LIVECHAT_TRANSCRIPT_HISTORY: 'livechat_transcript_history',
	COMMAND: 'command',
	LIVECHAT_STARTED: 'livechat-started',
	LIVECHAT_CLOSE: 'livechat-close',
	LIVECHAT_VIDEO_CALL: 'livechat_video_call',
	LIVECHAT_WEBRTC_VIDEO_CALL: 'livechat_webrtc_video_call',
	LIVECHAT_TRANSFER_HISTORY: 'livechat_transfer_history'
};

export const SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME = [
	SYSTEM_MESSAGE_TYPES.MESSAGE_REMOVED,
	SYSTEM_MESSAGE_TYPES.MESSAGE_PINNED,
	SYSTEM_MESSAGE_TYPES.MESSAGE_SNIPPETED,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_CHANNEL,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_TEAM,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_DISCUSSION,
	SYSTEM_MESSAGE_TYPES.USER_LEFT_CHANNEL,
	SYSTEM_MESSAGE_TYPES.USER_LEFT_TEAM,
	SYSTEM_MESSAGE_TYPES.REMOVED_USER_FROM_TEAM,
	SYSTEM_MESSAGE_TYPES.ADDED_USER_TO_TEAM,
	SYSTEM_MESSAGE_TYPES.ADDED_ROOM_TO_TEAM,
	SYSTEM_MESSAGE_TYPES.CONVERTED_TO_TEAM,
	SYSTEM_MESSAGE_TYPES.CONVERTED_TO_CHANNEL,
	SYSTEM_MESSAGE_TYPES.DELETED_ROOM_FROM_TEAM,
	SYSTEM_MESSAGE_TYPES.REMOVED_ROOM_FROM_TEAM,
	SYSTEM_MESSAGE_TYPES.LIVECHAT_NAVIGATION_HISTORY,
	SYSTEM_MESSAGE_TYPES.LIVECHAT_TRANSCRIPT_HISTORY,
	SYSTEM_MESSAGE_TYPES.COMMAND,
	SYSTEM_MESSAGE_TYPES.LIVECHAT_STARTED,
	SYSTEM_MESSAGE_TYPES.LIVECHAT_CLOSE,
	SYSTEM_MESSAGE_TYPES.LIVECHAT_VIDEO_CALL,
	SYSTEM_MESSAGE_TYPES.LIVECHAT_WEBRTC_VIDEO_CALL,
	SYSTEM_MESSAGE_TYPES.LIVECHAT_TRANSFER_HISTORY
];

type TInfoMessage = {
	type: string;
	role: string;
	msg: string;
	author: { username: string };
	comment?: string;
};

export const getInfoMessage = ({ type, role, msg, author, comment }: TInfoMessage): string => {
	const { username } = author;

	if (type === 'rm') {
		return I18n.t('Message_removed');
	}
	if (type === 'uj') {
		return I18n.t('Has_joined_the_channel');
	}
	if (type === 'ujt') {
		return I18n.t('Has_joined_the_team');
	}
	if (type === 'ut') {
		return I18n.t('Has_joined_the_conversation');
	}
	if (type === 'r') {
		return I18n.t('Room_name_changed', { name: msg, userBy: username });
	}
	if (type === 'message_pinned') {
		return I18n.t('Message_pinned');
	}
	if (type === 'jitsi_call_started') {
		return I18n.t('Started_call', { userBy: username });
	}
	if (type === 'ul') {
		return I18n.t('Has_left_the_channel');
	}
	if (type === 'ult') {
		return I18n.t('Has_left_the_team');
	}
	if (type === 'ru') {
		return I18n.t('User_removed_by', { userRemoved: msg, userBy: username });
	}
	if (type === 'au') {
		return I18n.t('User_added_by', { userAdded: msg, userBy: username });
	}
	if (type === 'user-muted') {
		return I18n.t('User_muted_by', { userMuted: msg, userBy: username });
	}
	if (type === 'user-unmuted') {
		return I18n.t('User_unmuted_by', { userUnmuted: msg, userBy: username });
	}
	if (type === 'subscription-role-added') {
		return `${msg} was set ${role} by ${username}`;
	}
	if (type === 'subscription-role-removed') {
		return `${msg} is no longer ${role} by ${username}`;
	}
	if (type === 'room_changed_description') {
		return I18n.t('Room_changed_description', { description: msg, userBy: username });
	}
	if (type === 'room_changed_announcement') {
		return I18n.t('Room_changed_announcement', { announcement: msg, userBy: username });
	}
	if (type === 'room_changed_topic') {
		return I18n.t('Room_changed_topic', { topic: msg, userBy: username });
	}
	if (type === 'room_changed_privacy') {
		return I18n.t('Room_changed_privacy', { type: msg, userBy: username });
	}
	if (type === 'room_changed_avatar') {
		return I18n.t('Room_changed_avatar', { userBy: username });
	}
	if (type === 'message_snippeted') {
		return I18n.t('Created_snippet');
	}
	if (type === 'room_e2e_disabled') {
		return I18n.t('This_room_encryption_has_been_disabled_by__username_', { username });
	}
	if (type === 'room_e2e_enabled') {
		return I18n.t('This_room_encryption_has_been_enabled_by__username_', { username });
	}
	if (type === 'removed-user-from-team') {
		return I18n.t('Removed__username__from_team', { user_removed: msg });
	}
	if (type === 'added-user-to-team') {
		return I18n.t('Added__username__to_team', { user_added: msg });
	}
	if (type === 'user-added-room-to-team') {
		return I18n.t('added__roomName__to_team', { roomName: msg });
	}
	if (type === 'user-converted-to-team') {
		return I18n.t('Converted__roomName__to_team', { roomName: msg });
	}
	if (type === 'user-converted-to-channel') {
		return I18n.t('Converted__roomName__to_channel', { roomName: msg });
	}
	if (type === 'user-deleted-room-from-team') {
		return I18n.t('Deleted__roomName__', { roomName: msg });
	}
	if (type === 'user-removed-room-from-team') {
		return I18n.t('Removed__roomName__from_this_team', { roomName: msg });
	}
	if (type === 'room-disallowed-reacting') {
		return I18n.t('Room_disallowed_reacting', { userBy: username });
	}
	if (type === 'room-allowed-reacting') {
		return I18n.t('Room_allowed_reacting', { userBy: username });
	}
	if (type === 'room-set-read-only') {
		return I18n.t('Room_set_read_only', { userBy: username });
	}
	if (type === 'room-removed-read-only') {
		return I18n.t('Room_removed_read_only', { userBy: username });
	}
	if (type === 'omnichannel_placed_chat_on_hold') {
		return I18n.t('Omnichannel_placed_chat_on_hold', { comment });
	}
	if (type === 'omnichannel_on_hold_chat_resumed') {
		return I18n.t('Omnichannel_on_hold_chat_resumed', { comment });
	}
	if (type === 'command') {
		return I18n.t('Livechat_transfer_return_to_the_queue');
	}
	if (type === 'livechat-started') {
		return I18n.t('Chat_started');
	}
	if (type === 'livechat-close') {
		return I18n.t('Conversation_closed');
	}
	if (type === 'livechat_transfer_history') {
		return I18n.t('New_chat_transfer', { agent: username });
	}
	return I18n.t('Unsupported_system_message');
};

export const getMessageTranslation = (message: TMessageModel, autoTranslateLanguage: string) => {
	if (!autoTranslateLanguage) {
		return null;
	}
	const { translations } = message;
	if (translations) {
		const translation = translations.find((trans: any) => trans.language === autoTranslateLanguage);
		return translation && translation.value;
	}
	return null;
};
