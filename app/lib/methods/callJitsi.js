import JitsiMeet from 'react-native-jitsi-meet';

import reduxStore from '../createStore';
import RocketChat from '../rocketchat';

const callJitsi = (rid, newCall = true) => {
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
	setTimeout(() => {
		JitsiMeet.call(`${ jitsiBaseURL }${ rid }`);
	}, 1000);
};

export default callJitsi;
