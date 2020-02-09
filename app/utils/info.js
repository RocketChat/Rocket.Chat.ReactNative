import { Alert } from 'react-native';
import I18n from '../i18n';

export const showErrorAlert = (message, title, onPress = () => {}) => Alert.alert(title, message, [{ text: 'OK', onPress }], { cancelable: true });

export const showConfirmationAlert = (message, title, CTA, onPress = () => {}) => (
	Alert.alert(
		title,
		message,
		[
			{
				text: I18n.t('Cancel'),
				style: 'cancel'
			},
			{
				text: CTA,
				style: 'destructive',
				onPress
			}
		],
		{ cancelable: true }
	)
);
