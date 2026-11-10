import NativeWatchModule from '~/lib/native/NativeWatchModule';
import log from '../helpers/log';
import { isWatchAppInstalled } from './isWatchAppInstalled';

export function syncWatchOSQuickReplies(): void {
	if (!isWatchAppInstalled()) return;
	try {
		const result = NativeWatchModule?.syncQuickReplies();
		if (result?.startsWith('[ERROR]')) {
			log(new Error(result));
		}
	} catch (e) {
		log(e);
	}
}
