import i18n from '../../i18n';
import { type TAudioState } from './types';

const getPlayButtonAccessibilityLabel = (state: TAudioState) => {
	switch (state) {
		case 'loading':
			return i18n.t('Loading');
		case 'paused':
			return i18n.t('Play');
		case 'playing':
			return i18n.t('Pause');
		case 'to-download':
			return i18n.t('To_download');
		default:
			return '';
	}
};

export default getPlayButtonAccessibilityLabel;
