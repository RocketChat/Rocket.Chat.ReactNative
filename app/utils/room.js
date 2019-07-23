import moment from 'moment';

import I18n from '../i18n';

export const isOwner = room => room && room.roles && room.roles.length && !!room.roles.find(role => role === 'owner');

export const isMuted = (room, user) => room && room.muted && room.muted.find && !!room.muted.find(m => m === user.username);

export const isReadOnly = (room, user) => {
	if (isOwner(room)) {
		return false;
	}
	return (room && room.ro) || isMuted(room, user);
};

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
