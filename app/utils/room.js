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

export const formatDateThreads = (date) => {
	const now = moment();
	const momentDate = moment(date);
	const diff = momentDate.diff(now, 'days', true);

	// If it is more than one week ago
	if (diff < -6) {
		let format = momentDate.format('ll');

		// If it is same year
		if (now.year() === momentDate.year()) {
			format = format.replace(momentDate.format('YYYY'), ''); // Remove year
		}

		return format
			.replace(/[рг]\./, '') 	// Remove year letter from RU/UK locales
			.replace(/de/g, '') 		// Remove preposition from PT
			.replace(/b\.$/, '') 		// Remove year prefix from SE
			.trim() 								// Remove spaces from the start and the end
			.replace(/,$/g, ''); 		// Remove comma from the end
	}

	return momentDate.calendar(null, {
		sameDay: 'LT',
		lastDay: `[${ I18n.t('Yesterday') }] LT`,
		lastWeek: 'dddd LT',
		sameElse: 'll'
	});
};

export const getBadgeColor = ({ subscription, messageId, theme }) => {
	if (subscription?.tunreadUser?.includes(messageId)) {
		return themes[theme].mentionMeBackground;
	}
	if (subscription?.tunreadGroup?.includes(messageId)) {
		return themes[theme].mentionGroupBackground;
	}
	if (subscription?.tunread?.includes(messageId)) {
		return themes[theme].tunreadBackground;
	}
};

export const makeThreadName = messageRecord => messageRecord.msg || messageRecord?.attachments[0]?.title;
