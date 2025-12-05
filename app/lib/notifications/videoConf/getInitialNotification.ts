import { deepLinkingClickCallPush } from '../../../actions/deepLinking';
import { isAndroid } from '../../methods/helpers';
import { store } from '../../store/auxStore';

/**
 * Checks for and handles initial video conference notifications on Android.
 * @returns true if a video conf notification was handled, false otherwise
 */
export const getInitialNotification = async (): Promise<boolean> => {
	if (isAndroid) {
		const notifee = require('@notifee/react-native').default;
		const initialNotification = await notifee.getInitialNotification();
		if (initialNotification?.notification?.data?.notificationType === 'videoconf') {
			store.dispatch(
				deepLinkingClickCallPush({ ...initialNotification?.notification?.data, event: initialNotification?.pressAction?.id })
			);
			return true;
		}
	}
	return false;
};
