import { deepLinkingClickCallPush } from '../../../actions/deepLinking';
import { isAndroid } from '../../methods/helpers';
import { store } from '../../store/auxStore';

export const getInitialNotification = async (): Promise<void> => {
	if (isAndroid) {
		const notifee = require('@notifee/react-native').default;
		const initialNotification = await notifee.getInitialNotification();
		if (initialNotification?.notification?.data?.notificationType === 'videoconf') {
			store.dispatch(
				deepLinkingClickCallPush({ ...initialNotification?.notification?.data, event: initialNotification?.pressAction?.id })
			);
		}
	}
};
