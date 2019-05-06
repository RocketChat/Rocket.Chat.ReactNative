import moment from 'moment';

import I18n from '../../i18n';

export const formatLastMessage = (lm) => {
	// const { customThreadTimeFormat } = this.props;
	// if (customThreadTimeFormat) {
	// 	return moment(lm).format(customThreadTimeFormat);
	// }
	return lm ? moment(lm).calendar(null, {
		lastDay: `[${ I18n.t('Yesterday') }]`,
		sameDay: 'h:mm A',
		lastWeek: 'dddd',
		sameElse: 'MMM D'
	}) : null;
};

export const formatMessageCount = (count, type) => {
	const discussion = type === 'discussion';
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
