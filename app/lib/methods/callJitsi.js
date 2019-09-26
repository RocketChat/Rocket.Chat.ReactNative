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

function callJitsi(rid, onlyAudio = false) {
	const { settings } = reduxStore.getState();

	Navigation.navigate('JitsiMeetView', { url: `${ jitsiBaseUrl(settings) }${ rid }`, onlyAudio, rid });
}

export default callJitsi;
