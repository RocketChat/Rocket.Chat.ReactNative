import { store } from '../../store/auxStore';
import { isSecureHttpUrl } from './isConferenceUrl';

// The conference window hands the login token to a webview, so it is only offered over https
// (or a loopback dev server); elsewhere callers fall back to the regular join flow.
export const isConferenceWindowEnabled = (): boolean => {
	const state = store.getState();
	return state.settings.VideoConf_Conference_Window_Enabled === true && isSecureHttpUrl(state.server.server);
};
