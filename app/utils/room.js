import moment from 'moment';

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
	sameElse: 'MMM D'
});
