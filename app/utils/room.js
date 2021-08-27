import moment from 'moment';
import { themes } from '../constants/colors';

import I18n from '../i18n';

export const isBlocked = (room) => {
	if (room) {
		const { t, blocked, blocker } = room;
		if (t === 'd' && (blocked || blocker)) {
			return true;
		}
	}
	return false;
};

export const capitalize = (s) => {
	if (typeof s !== 'string') { return ''; }
	return s.charAt(0).toUpperCase() + s.slice(1);
};

export const formatDate = date => moment(date).calendar(null, {
	lastDay: `[${ I18n.t('Yesterday') }]`,
	sameDay: 'LT',
	lastWeek: 'dddd',
	sameElse: 'L'
});

export const formatDateThreads = date => moment(date).calendar(null, {
	sameDay: 'LT',
	lastDay: `[${ I18n.t('Yesterday') }] LT`,
	lastWeek: 'dddd LT',
	sameElse: 'LL'
});

export const getBadgeColor = ({ subscription, messageId, theme }) => {
	if (subscription?.tunreadUser?.includes(messageId)) {
		return themes[theme].mentionMeColor;
	}
	if (subscription?.tunreadGroup?.includes(messageId)) {
		return themes[theme].mentionGroupColor;
	}
	if (subscription?.tunread?.includes(messageId)) {
		return themes[theme].tunreadColor;
	}
};

export const makeThreadName = messageRecord => messageRecord.msg || messageRecord?.attachments[0]?.title;

export const isTeamRoom = ({ teamId, joined }) => teamId && joined;
