import I18n from '../../../i18n';
import Navigation from '../../navigation/appNavigation';
import { Services } from '../../services';
import { showErrorAlert } from './info';
import log from './log';

export const closeLivechat = async ({
	rid,
	comment,
	isMasterDetail,
	tags
}: {
	rid: string;
	isMasterDetail: boolean;
	comment?: string;
	tags?: string[];
}) => {
	try {
		await Services.closeLivechat(rid, comment, tags);
		if (isMasterDetail) {
			Navigation.navigate('DrawerNavigator');
		} else {
			Navigation.navigate('RoomsListView');
		}
	} catch (e: any) {
		showErrorAlert(I18n.isTranslated(e.error) ? I18n.t(e.error) : e.reason, I18n.t('Oops'));
		log(e);
	}
};
