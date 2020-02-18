import reduxStore from '../createStore';
import Navigation from '../Navigation';

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

async function callJitsi(rid, onlyAudio = false) {
	let accessToken;
	let queryString = '';
	const { settings } = reduxStore.getState();
	const { Jitsi_Enabled_TokenAuth } = settings;

	if (Jitsi_Enabled_TokenAuth) {
		try {
			accessToken = await this.sdk.methodCall('jitsi:generateAccessToken', rid);
		} catch (e) {
			// do nothing
		}
	}

	if (accessToken) {
		queryString = `?jwt=${ accessToken }`;
	}

	Navigation.navigate('JitsiMeetView', { url: `${ jitsiBaseUrl(settings) }${ rid }${ queryString }`, onlyAudio, rid });
}

export default callJitsi;
