import { Alert } from 'react-native';

import I18n from '../../../i18n';

export const handleError = (e: any, _func: string, action: string) => {
	if (e.data && e.data.error.includes('[error-too-many-requests]')) {
		return showErrorAlert(e.data.error);
	}
	if (I18n.isTranslated(e.error)) {
		return showErrorAlert(I18n.t(e.error));
	}
	showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }));
};

export const showErrorAlert = (message: string, title?: string, onPress = () => {}): void =>
	Alert.alert(title || '', message, [{ text: 'OK', onPress }], { cancelable: true });

export const showErrorAlertWithEMessage = (e: any): void => {
	const messageError =
		e.data && e.data.error.includes('[error-too-many-requests]')
			? I18n.t('error-too-many-requests', { seconds: e.data.error.replace(/\D/g, '') })
			: e.data.errorType;
	showErrorAlert(messageError);
};

interface IShowConfirmationAlert {
	title?: string;
	message: string;
	confirmationText: string;
	dismissText?: string;
	onPress: () => void;
	onCancel?: () => void;
}

export const showConfirmationAlert = ({
	title,
	message,
	confirmationText,
	dismissText = I18n.t('Cancel'),
	onPress,
	onCancel
}: IShowConfirmationAlert): void =>
	Alert.alert(
		title || I18n.t('Are_you_sure_question_mark'),
		message,
		[
			{
				text: dismissText,
				onPress: onCancel,
				style: 'cancel'
			},
			{
				text: confirmationText,
				style: 'destructive',
				onPress
			}
		],
		{ cancelable: false }
	);
