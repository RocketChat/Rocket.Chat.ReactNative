import I18n from '../../../i18n';

interface IGetEmptyListMessage {
	screenName: string;
}

const getListEmptyMessage = ({ screenName }: IGetEmptyListMessage): string | undefined => {
	switch (screenName) {
		case 'Files':
			return I18n.t('No_files');
		case 'Mentions':
			return I18n.t('No_mentioned_messages');
		case 'Starred':
			return I18n.t('No_starred_messages');
		case 'Pinned':
			return I18n.t('No_pinned_messages');
	}
};

export default getListEmptyMessage;
