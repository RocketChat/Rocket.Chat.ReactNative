import { Alert } from 'react-native';

import I18n from '../../../i18n';

export const showErrorAlert = (message: string, title?: string, onPress = () => {}): void =>
	Alert.alert(title || '', message, [{ text: 'OK', onPress }], { cancelable: true });

export const showErrorAlertWithEMessage = (e: any, title?: string): void => {
	let errorMessage: string = e?.data?.error;

	if (errorMessage?.includes('[error-too-many-requests]')) {
		const seconds = errorMessage.replace(/\D/g, '');
		errorMessage = I18n.t('error-too-many-requests', { seconds });
	} else {
		errorMessage = I18n.isTranslated(errorMessage) ? I18n.t(errorMessage) : errorMessage;
	}

	showErrorAlert(errorMessage, title);
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
