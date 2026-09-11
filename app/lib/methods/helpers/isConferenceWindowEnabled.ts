import { store } from '../../store/auxStore';
import { isSecureHttpUrl } from './isConferenceUrl';

export const isConferenceWindowEnabled = (): boolean => {
	const state = store.getState();
	return state.settings.VideoConf_Conference_Window_Enabled === true && isSecureHttpUrl(state.server.server);
};
