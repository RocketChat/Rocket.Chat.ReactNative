import JitsiMeet, { JitsiMeetEvents } from 'react-native-jitsi-meet';

import reduxStore from '../createStore';
import RocketChat from '../rocketchat';

let jitsiTimeOut = null;

// Jitsi Update Call needs to be called every 10 seconds to make sure
// call is not ended and is available to web users.
const updateJitsiTimeout = (rid) => {
	JitsiMeetEvents.addListener('CONFERENCE_JOINED', () => {
		RocketChat.updateJitsiTimeout(rid);
		jitsiTimeOut = setInterval(async() => {
			await RocketChat.updateJitsiTimeout(rid);
		}, 10000);
	});
	JitsiMeetEvents.addListener('CONFERENCE_LEFT', () => {
		if (jitsiTimeOut) {
			clearInterval(jitsiTimeOut);
		}
	});
};

const callJitsi = (rid, options = {}) => {
	const { jitsi } = reduxStore.getState();
	const { jitsiBaseURL } = jitsi;

	JitsiMeet.initialize();
	updateJitsiTimeout(rid);
	setTimeout(() => {
		JitsiMeet.call(`${ jitsiBaseURL }${ rid }`, options);
	}, 1000);
};

export default callJitsi;
