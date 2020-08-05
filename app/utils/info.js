import { Alert } from 'react-native';
import I18n from '../i18n';

export const showErrorAlert = (message, title, onPress = () => {}) => Alert.alert(title, message, [{ text: 'OK', onPress }], { cancelable: true });

export const showConfirmationAlert = ({title, message, callToAction, onPress, onCancel }) => (
	Alert.alert(
		title || I18n.t('Are_you_sure_question_mark'),
		message,
		[
			{
				text: I18n.t('Cancel'),
				onPress: onCancel,
				style: 'cancel',
			},
			{
				text: callToAction,
				style: 'destructive',
				onPress
			}
		],
		{ cancelable: false }
	)
);
