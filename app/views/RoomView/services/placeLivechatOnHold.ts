import i18n from '../../../i18n';
import { showConfirmationAlert, showErrorAlert } from '../../../lib/methods/helpers';
import { onHoldLivechat } from '../../../lib/services/restApi';
import { type TRoomStackNavigation } from '../hooks/navigateToScreen';

export const placeLivechatOnHold = ({ rid, navigation }: { rid: string; navigation: TRoomStackNavigation }): void => {
	showConfirmationAlert({
		title: i18n.t('Are_you_sure_question_mark'),
		message: i18n.t('Would_like_to_place_on_hold'),
		confirmationText: i18n.t('Yes'),
		onPress: async () => {
			try {
				await onHoldLivechat(rid);
				navigation.navigate('RoomsListView');
			} catch (e: any) {
				showErrorAlert(e.data?.error, i18n.t('Oops'));
			}
		}
	});
};
