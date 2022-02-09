import { store as reduxStore } from '../auxStore';
import Navigation from '../Navigation';
import { events, logEvent } from '../../utils/log';

async function jitsiURL({ room }) {
	const { settings } = reduxStore.getState();
	const { Jitsi_Enabled } = settings;

	if (!Jitsi_Enabled) {
		return '';
	}

	const { Jitsi_Domain, Jitsi_URL_Room_Prefix, Jitsi_SSL, Jitsi_Enabled_TokenAuth, uniqueID, Jitsi_URL_Room_Hash } = settings;

	const domain = `${Jitsi_Domain}/`;
	const prefix = Jitsi_URL_Room_Prefix;
	const protocol = Jitsi_SSL ? 'https://' : 'http://';

	let queryString = '';
	if (Jitsi_Enabled_TokenAuth) {
		try {
			const accessToken = await this.methodCallWrapper('jitsi:generateAccessToken', room?.rid);
			queryString = `?jwt=${accessToken}`;
		} catch {
			logEvent(events.RA_JITSI_F);
		}
	}

	let rname;
	if (Jitsi_URL_Room_Hash) {
		rname = uniqueID + room?.rid;
	} else {
		rname = encodeURIComponent(room.t === 'd' ? room?.usernames?.join?.(' x ') : room?.name);
	}

	return `${protocol}${domain}${prefix}${rname}${queryString}`;
}

export function callJitsiWithoutServer(path) {
	logEvent(events.RA_JITSI_VIDEO);
	const { Jitsi_SSL } = reduxStore.getState().settings;
	const protocol = Jitsi_SSL ? 'https://' : 'http://';
	const url = `${protocol}${path}`;
	Navigation.navigate('JitsiMeetView', { url, onlyAudio: false });
}

async function callJitsi(room, onlyAudio = false) {
	logEvent(onlyAudio ? events.RA_JITSI_AUDIO : events.RA_JITSI_VIDEO);
	const url = await jitsiURL.call(this, { room });
	Navigation.navigate('JitsiMeetView', { url, onlyAudio, rid: room?.rid });
}

export default callJitsi;
