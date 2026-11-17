import NativeWatchModule from '~/lib/native/NativeWatchModule';
import log from '../helpers/log';
import { isWatchAppInstalled } from './isWatchAppInstalled';

export function syncWatchOSQuickReplies(): void {
	if (!isWatchAppInstalled()) return;
	try {
		const error = NativeWatchModule?.syncQuickReplies();
		if (error) {
			log(new Error(error));
		}
	} catch (e) {
		log(e);
	}
}
