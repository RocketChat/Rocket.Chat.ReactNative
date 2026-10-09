import { Alert } from 'react-native';

import I18n from '~/i18n';
import { isTwoFactorCancelled } from '~/lib/services/twoFactor/twoFactorCancelled';

export const showErrorAlert = (message: string, title?: string, onPress = () => {}): void =>
	Alert.alert(title || '', message, [{ text: 'OK', onPress }], { cancelable: true });

const getErrorCode = (e: any): string | undefined => e?.data?.errorType || (typeof e?.error === 'string' ? e.error : undefined);

const withoutErrorCode = (message: string, code?: string): string => {
	const suffix = ` [${code}]`;
	return code && message?.endsWith(suffix) ? message.slice(0, -suffix.length) : message;
};

export const showErrorAlertWithEMessage = (e: any, title?: string): void => {
	if (isTwoFactorCancelled(e)) {
		return;
	}
	const code = getErrorCode(e);
	let errorMessage: string = e?.data?.error || e?.reason || e?.message;

	if (errorMessage?.includes('[error-too-many-requests]')) {
		const seconds = errorMessage.replace(/\D/g, '');
		errorMessage = I18n.t('error-too-many-requests', { seconds });
	} else if (code && I18n.isTranslated(code)) {
		errorMessage = I18n.t(code);
	} else {
		const withoutCode = withoutErrorCode(errorMessage, code);
		errorMessage = I18n.isTranslated(withoutCode) ? I18n.t(withoutCode) : withoutCode;
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
