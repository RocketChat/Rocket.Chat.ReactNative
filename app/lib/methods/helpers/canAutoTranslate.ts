import log from './log';
import { store as reduxStore } from '~/lib/store/auxStore';

export function canAutoTranslate() {
	try {
		const { AutoTranslate_Enabled } = reduxStore.getState().settings;
		if (!AutoTranslate_Enabled) {
			return false;
		}
		const autoTranslatePermission = reduxStore.getState().permissions['auto-translate'];
		const userRoles = new Set(reduxStore.getState().login?.user?.roles);
		return autoTranslatePermission?.some(role => userRoles.has(role)) ?? false;
	} catch (e) {
		log(e);
		return false;
	}
}
