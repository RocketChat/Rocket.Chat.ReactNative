import { ISubscription } from '../../definitions';
import { events, logEvent } from './helpers/log';
import { store } from '../store/auxStore';
import Navigation from '../navigation/appNavigation';
import sdk from '../services/sdk';

async function jitsiURL({ room }: { room: ISubscription }) {
	const { settings } = store.getState();
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
			const accessToken = await sdk.methodCallWrapper('jitsi:generateAccessToken', room?.rid);
			queryString = `?jwt=${accessToken}`;
		} catch {
			logEvent(events.RA_JITSI_F);
		}
	}

	let rname;
	if (Jitsi_URL_Room_Hash) {
		rname = uniqueID + room?.rid;
	} else {
		rname = encodeURIComponent(room.t === 'd' ? (room?.usernames?.join?.(' x ') as string) : room?.name);
	}

	return `${protocol}${domain}${prefix}${rname}${queryString}`;
}

export function callJitsiWithoutServer(path: string): void {
	logEvent(events.RA_JITSI_VIDEO);
	const { Jitsi_SSL } = store.getState().settings;
	const protocol = Jitsi_SSL ? 'https://' : 'http://';
	const url = `${protocol}${path}`;
	Navigation.navigate('JitsiMeetView', { url, onlyAudio: false });
}

export async function callJitsi({ room, cam = false }: { room: ISubscription; cam?: boolean }): Promise<void> {
	logEvent(cam ? events.RA_JITSI_AUDIO : events.RA_JITSI_VIDEO);
	const url = await jitsiURL({ room });
	Navigation.navigate('JitsiMeetView', { url, onlyAudio: cam, rid: room?.rid });
}
