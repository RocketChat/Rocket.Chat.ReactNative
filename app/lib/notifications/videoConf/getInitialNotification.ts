import { NativeModules, Platform } from 'react-native';

import { deepLinkingClickCallPush } from '../../../actions/deepLinking';
import { store } from '../../store/auxStore';

const { VideoConfModule } = NativeModules;

/**
 * Check for pending video conference actions from native notification handling.
 * @returns true if a video conf action was found and dispatched, false otherwise
 */
export const getInitialNotification = async (): Promise<boolean> => {
	if (Platform.OS === 'android' && VideoConfModule) {
		try {
			const pendingAction = await VideoConfModule.getPendingAction();
			if (pendingAction) {
				const data = JSON.parse(pendingAction);
				if (data?.notificationType === 'videoconf') {
					store.dispatch(deepLinkingClickCallPush(data));
					return true;
				}
			}
		} catch (error) {
			console.log('Error getting video conf initial notification:', error);
		}
	}
	return false;
};
