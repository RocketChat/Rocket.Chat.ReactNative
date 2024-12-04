import I18n from '../../../i18n';

const getActionTitle = (screenName: string) => {
	switch (screenName) {
		case 'Starred':
			return I18n.t('Unstar');

		case 'Pinned':
			return I18n.t('Unpin');
	}
};

export default getActionTitle;
