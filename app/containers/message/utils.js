import I18n from '../../i18n';
import { DISCUSSION } from './constants';

export const formatMessageCount = (count, type) => {
	const discussion = type === DISCUSSION;
	let text = discussion ? I18n.t('No_messages_yet') : null;
	if (count === 1) {
		text = `${ count } ${ discussion ? I18n.t('message') : I18n.t('reply') }`;
	} else if (count > 1 && count < 1000) {
		text = `${ count } ${ discussion ? I18n.t('messages') : I18n.t('replies') }`;
	} else if (count > 999) {
		text = `+999 ${ discussion ? I18n.t('messages') : I18n.t('replies') }`;
	}
	return text;
};

export const BUTTON_HIT_SLOP = {
	top: 4, right: 4, bottom: 4, left: 4
};

export const SYSTEM_MESSAGES = [
	'r',
	'au',
	'ru',
	'ul',
	'uj',
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
	'room_e2e_disabled'
];

export const SYSTEM_MESSAGE_TYPES = {
	MESSAGE_REMOVED: 'rm',
	MESSAGE_PINNED: 'message_pinned',
	MESSAGE_SNIPPETED: 'message_snippeted',
	USER_JOINED_CHANNEL: 'uj',
	USER_JOINED_DISCUSSION: 'ut',
	USER_LEFT_CHANNEL: 'ul'
};

export const SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME = [
	SYSTEM_MESSAGE_TYPES.MESSAGE_REMOVED,
	SYSTEM_MESSAGE_TYPES.MESSAGE_PINNED,
	SYSTEM_MESSAGE_TYPES.MESSAGE_SNIPPETED,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_CHANNEL,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_DISCUSSION,
	SYSTEM_MESSAGE_TYPES.USER_LEFT_CHANNEL
];

export const getInfoMessage = ({
	type, role, msg, author
}) => {
	const { username } = author;
	if (type === 'rm') {
		return I18n.t('Message_removed');
	} else if (type === 'uj') {
		return I18n.t('Has_joined_the_channel');
	} else if (type === 'ut') {
		return I18n.t('Has_joined_the_conversation');
	} else if (type === 'r') {
		return I18n.t('Room_name_changed', { name: msg, userBy: username });
	} else if (type === 'message_pinned') {
		return I18n.t('Message_pinned');
	} else if (type === 'jitsi_call_started') {
		return I18n.t('Started_call', { userBy: username });
	} else if (type === 'ul') {
		return I18n.t('Has_left_the_channel');
	} else if (type === 'ru') {
		return I18n.t('User_removed_by', { userRemoved: msg, userBy: username });
	} else if (type === 'au') {
		return I18n.t('User_added_by', { userAdded: msg, userBy: username });
	} else if (type === 'user-muted') {
		return I18n.t('User_muted_by', { userMuted: msg, userBy: username });
	} else if (type === 'user-unmuted') {
		return I18n.t('User_unmuted_by', { userUnmuted: msg, userBy: username });
	} else if (type === 'subscription-role-added') {
		return `${ msg } was set ${ role } by ${ username }`;
	} else if (type === 'subscription-role-removed') {
		return `${ msg } is no longer ${ role } by ${ username }`;
	} else if (type === 'room_changed_description') {
		return I18n.t('Room_changed_description', { description: msg, userBy: username });
	} else if (type === 'room_changed_announcement') {
		return I18n.t('Room_changed_announcement', { announcement: msg, userBy: username });
	} else if (type === 'room_changed_topic') {
		return I18n.t('Room_changed_topic', { topic: msg, userBy: username });
	} else if (type === 'room_changed_privacy') {
		return I18n.t('Room_changed_privacy', { type: msg, userBy: username });
	} else if (type === 'room_changed_avatar') {
		return I18n.t('Room_changed_avatar', { userBy: username });
	} else if (type === 'message_snippeted') {
		return I18n.t('Created_snippet');
	} else if (type === 'room_e2e_disabled') {
		return I18n.t('This_room_encryption_has_been_disabled_by__username_', { username });
	} else if (type === 'room_e2e_enabled') {
		return I18n.t('This_room_encryption_has_been_enabled_by__username_', { username });
	}
	return '';
};

export const getMessageTranslation = (message, autoTranslateLanguage) => {
	if (!autoTranslateLanguage) {
		return null;
	}
	const { translations } = message;
	if (translations) {
		const translation = translations.find(trans => trans.language === autoTranslateLanguage);
		return translation && translation.value;
	}
	return null;
};
