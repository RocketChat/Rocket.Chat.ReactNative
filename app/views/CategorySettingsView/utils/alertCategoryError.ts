import I18n from '~/i18n';
import { showErrorAlert } from '~/lib/methods/helpers/info';
import log from '~/lib/methods/helpers/log';

export const alertCategoryError = (error: any) => {
	log(error);
	showErrorAlert(error?.data?.error ?? error?.message ?? '', I18n.t('Oops'));
};
