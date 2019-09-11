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

const callJitsi = (rid, options = {}, newCall = true) => {
	const { login, jitsi } = reduxStore.getState();
	const { jitsiBaseURL } = jitsi;
	const { id, username, token } = login.user;

	if (newCall) {
		RocketChat.sendMessage(
			rid,
			{ type: 'jitsi_call_started' },
			undefined,
			{ id, username, token }
		);
	}

	JitsiMeet.initialize();
	updateJitsiTimeout(rid);
	setTimeout(() => {
		JitsiMeet.call(`${ jitsiBaseURL }${ rid }`, options);
	}, 1000);
};

export default callJitsi;
