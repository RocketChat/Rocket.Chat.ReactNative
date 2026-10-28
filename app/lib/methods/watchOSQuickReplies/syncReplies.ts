import NativeWatchModule from '~/lib/native/NativeWatchModule';
import log from '../helpers/log';
import { shouldShowWatchAppOptions } from './getWatchStatus';

export function syncWatchOSQuickReplies(server: string): void {
	if (!shouldShowWatchAppOptions()) return;
	try {
		const result = NativeWatchModule?.syncQuickReplies(server);
		if (result?.startsWith('[ERROR]')) {
			log(new Error(result));
		}
	} catch (e) {
		log(e);
	}
}
