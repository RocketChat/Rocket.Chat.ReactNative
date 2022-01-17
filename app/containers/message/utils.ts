import I18n from '../../i18n';
import { DISCUSSION } from './constants';

export const formatMessageCount = (count: number, type: string) => {
	const discussion = type === DISCUSSION;
	let text = discussion ? I18n.t('No_messages_yet') : null;
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
	'room_e2e_disabled'
];

export const SYSTEM_MESSAGE_TYPES = {
	MESSAGE_REMOVED: 'rm',
	MESSAGE_PINNED: 'message_pinned',
	MESSAGE_SNIPPETED: 'message_snippeted',
	USER_JOINED_CHANNEL: 'uj',
	USER_JOINED_TEAM: 'ujt',
	USER_JOINED_DISCUSSION: 'ut',
	USER_LEFT_CHANNEL: 'ul',
	USER_LEFT_TEAM: 'ult'
};

export const SYSTEM_MESSAGE_TYPES_WITH_AUTHOR_NAME = [
	SYSTEM_MESSAGE_TYPES.MESSAGE_REMOVED,
	SYSTEM_MESSAGE_TYPES.MESSAGE_PINNED,
	SYSTEM_MESSAGE_TYPES.MESSAGE_SNIPPETED,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_CHANNEL,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_TEAM,
	SYSTEM_MESSAGE_TYPES.USER_JOINED_DISCUSSION,
	SYSTEM_MESSAGE_TYPES.USER_LEFT_CHANNEL,
	SYSTEM_MESSAGE_TYPES.USER_LEFT_TEAM
];

type TInfoMessage = {
	type: string;
	role: string;
	msg: string;
	author: { username: string };
};
export const getInfoMessage = ({ type, role, msg, author }: TInfoMessage) => {
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
	return '';
};

export const getMessageTranslation = (message: { translations: any }, autoTranslateLanguage: string) => {
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
