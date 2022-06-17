import { videoConferenceJoin } from '../services/restApi';
import navigation from '../navigation/appNavigation';

export const handleVideoConfJoin = async (callId: string) => {
	const result = await videoConferenceJoin(callId);
	if (result.success) {
		const { url } = result;
		if (url.includes('meet.jit.si')) {
			navigation.navigate('JitsiMeetView', { url, onlyAudio: true, videoConf: true });
		} else {
			navigation.navigate('LiveChatMeetView', { url });
		}
	}
};
