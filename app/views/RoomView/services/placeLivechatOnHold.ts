import i18n from '~/i18n';
import { showConfirmationAlert, showErrorAlert } from '~/lib/methods/helpers';
import { onHoldLivechat } from '~/lib/services/restApi';
import Navigation from '~/lib/navigation/appNavigation';

export const placeLivechatOnHold = ({ rid }: { rid: string }): void => {
	showConfirmationAlert({
		title: i18n.t('Are_you_sure_question_mark'),
		message: i18n.t('Would_like_to_place_on_hold'),
		confirmationText: i18n.t('Yes'),
		onPress: async () => {
			try {
				await onHoldLivechat(rid);
				Navigation.navigateToRoomsList();
			} catch (e: any) {
				showErrorAlert(e.data?.error, i18n.t('Oops'));
			}
		}
	});
};
