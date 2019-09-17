import JitsiMeet, { JitsiMeetEvents } from 'react-native-jitsi-meet';

import reduxStore from '../createStore';

let jitsiTimeOut = null;

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

	// Jitsi Update Call needs to be called every 10 seconds to make sure
	// call is not ended and is available to web users.
	JitsiMeet.initialize();
	JitsiMeetEvents.addListener('CONFERENCE_JOINED', () => {
		this.updateJitsiTimeout(rid);
		jitsiTimeOut = setInterval(async() => {
			await this.updateJitsiTimeout(rid);
		}, 10000);
	});
	JitsiMeetEvents.addListener('CONFERENCE_LEFT', () => {
		if (jitsiTimeOut) {
			clearInterval(jitsiTimeOut);
		}
	});
	setTimeout(() => {
		JitsiMeet.call(`${ jitsiBaseUrl(settings) }${ rid }`, options);
	}, 1000);
}

export default callJitsi;
