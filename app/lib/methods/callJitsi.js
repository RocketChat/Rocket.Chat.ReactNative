import reduxStore from '../createStore';
import Navigation from '../Navigation';

async function jitsiURL({ rid }) {
	const { settings } = reduxStore.getState();
	const { Jitsi_Enabled } = settings;

	if (!Jitsi_Enabled) {
		return '';
	}

	const {
		Jitsi_Domain, Jitsi_URL_Room_Prefix, Jitsi_SSL, Jitsi_Enabled_TokenAuth, uniqueID
	} = settings;

	const domain = `${ Jitsi_Domain }/`;
	const prefix = Jitsi_URL_Room_Prefix;
	const uniqueIdentifier = uniqueID || 'undefined';
	const protocol = Jitsi_SSL ? 'https://' : 'http://';

	let queryString = '';
	if (Jitsi_Enabled_TokenAuth) {
		try {
			const accessToken = await this.methodCallWrapper('jitsi:generateAccessToken', rid);
			queryString = `?jwt=${ accessToken }`;
		} catch {
			// do nothing
		}
	}

	return `${ protocol }${ domain }${ prefix }${ uniqueIdentifier }${ rid }${ queryString }`;
}

async function callJitsi(rid, onlyAudio = false) {
	const url = await jitsiURL.call(this, { rid });
	Navigation.navigate('JitsiMeetView', { url, onlyAudio, rid });
}

export default callJitsi;
