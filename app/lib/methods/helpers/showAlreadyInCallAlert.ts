import I18n from '~/i18n';
import { showErrorAlert } from './info';

export const showAlreadyInCallAlert = (): void => showErrorAlert(I18n.t('VoIP_Already_In_Call'), I18n.t('Oops'));
