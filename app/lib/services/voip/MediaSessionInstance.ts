import {
	ClientMediaSignal,
	MediaCallWebRTCProcessor,
	MediaSignalingSession,
	WebRTCProcessorConfig
} from '@rocket.chat/media-signaling';

import { mediaSessionStore } from './MediaSessionStore';
import { store } from '../../store/auxStore';
import sdk from '../sdk';
import { parseStringToIceServers } from './parseStringToIceServers';
import { IceServer } from '../../../definitions/Voip';
import { notifyUser } from '../restApi';

class MediaSessionInstance {
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private mediaSignalListener: any;
	private mediaSignalsListener: any;
	private instance: MediaSignalingSession | null = null;

	public init(userId: string): void {
		this.iceServers = this.getIceServers();
		console.log('iceServers', this.iceServers);
		this.iceGatheringTimeout = store.getState().settings.VoIP_TeamCollab_Ice_Gathering_Timeout as number;

		mediaSessionStore.setWebRTCProcessorFactory(
			(config: WebRTCProcessorConfig) =>
				new MediaCallWebRTCProcessor({
					...config,
					rtc: { ...config.rtc, iceServers: this.iceServers },
					iceGatheringTimeout: this.iceGatheringTimeout
				})
		);

		this.mediaSignalListener = sdk.onStreamData('stream-notify-user', (ddpMessage: any) => {
			if (!this.instance) {
				console.warn('Media Call - Tried to process signal, but no instance was set');
				return;
			}

			const [, ev] = ddpMessage.fields.eventName.split('/');
			if (ev !== 'media-signal') {
				return;
			}
			const signal = ddpMessage.fields.args[0];
			this.instance.processSignal(signal);
		});

		mediaSessionStore.setSendSignalFn((signal: ClientMediaSignal) => {
			sdk.methodCall('stream-notify-user', `${userId}/media-calls`, JSON.stringify(signal));
		});

		this.instance = mediaSessionStore.getInstance(userId);
		console.log('instance', this.instance);

		const mainCall = this.instance?.getMainCall();
		console.log('mainCall', mainCall);

		if (!mainCall) {
			this.instance?.startCall('sip', 'bMvbehmLppt3BzeMc');
		}
	}

	private getIceServers() {
		const iceServers = store.getState().settings.VoIP_TeamCollab_Ice_Servers as any;
		return parseStringToIceServers(iceServers);
	}
}

export const mediaSessionInstance = new MediaSessionInstance();
