import JitsiMeet, { JitsiMeetEvents } from 'react-native-jitsi-meet';
import BackgroundTimer from 'react-native-background-timer';

import reduxStore from '../createStore';

let jitsiTimeout = null;

const jitsiBaseUrl = ({
	Jitsi_Enabled, Jitsi_SSL, Jitsi_Domain, Jitsi_URL_Room_Prefix, uniqueID
}) => {
	if (!Jitsi_Enabled) {
		return '';
	}
	const uniqueIdentifier = uniqueID || 'undefined';
	const domain = Jitsi_Domain;
	const prefix = Jitsi_URL_Room_Prefix;

	const urlProtocol = Jitsi_SSL ? 'https://' : 'http://';
	const urlDomain = `${ domain }/`;

	return `${ urlProtocol }${ urlDomain }${ prefix }${ uniqueIdentifier }`;
};

function callJitsi(rid, options = {}) {
	const { settings } = reduxStore.getState();

	// Jitsi Update Timeout needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	JitsiMeet.initialize();
	const conferenceJoined = JitsiMeetEvents.addListener('CONFERENCE_JOINED', () => {
		this.updateJitsiTimeout(rid).catch(e => console.log(e));
		if (jitsiTimeout) {
			BackgroundTimer.clearInterval(jitsiTimeout);
		}
		jitsiTimeout = BackgroundTimer.setInterval(() => {
			this.updateJitsiTimeout(rid).catch(e => console.log(e));
		}, 10000);
	});
	const conferenceLeft = JitsiMeetEvents.addListener('CONFERENCE_LEFT', () => {
		if (jitsiTimeout) {
			BackgroundTimer.clearInterval(jitsiTimeout);
		}
		if (conferenceJoined && conferenceJoined.remove) {
			conferenceJoined.remove();
		}
		if (conferenceLeft && conferenceLeft.remove) {
			conferenceLeft.remove();
		}
	});
	JitsiMeet.call(`${ jitsiBaseUrl(settings) }${ rid }`, options);
}

export default callJitsi;
