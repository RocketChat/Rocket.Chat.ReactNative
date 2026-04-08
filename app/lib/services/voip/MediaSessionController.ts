import {
	MediaCallWebRTCProcessor,
	type WebRTCProcessorConfig,
	type MediaSignalingSession
} from '@rocket.chat/media-signaling';
import { registerGlobals } from 'react-native-webrtc';

import { mediaSessionStore } from './MediaSessionStore';
import { parseStringToIceServers } from './parseStringToIceServers';
import { store } from '../../store/auxStore';
import type { IceServer } from '../../../definitions/Voip';

export class MediaSessionController {
	private userId: string;
	private session: MediaSignalingSession | null = null;
	private iceServers: IceServer[] = [];
	private iceGatheringTimeout: number = 5000;
	private storeTimeoutUnsubscribe: (() => void) | null = null;
	private storeIceServersUnsubscribe: (() => void) | null = null;

	constructor(userId: string) {
		this.userId = userId;
	}

	public configure(): void {
		registerGlobals();
		this.configureIceServers();

		mediaSessionStore.setWebRTCProcessorFactory(
			(config: WebRTCProcessorConfig) =>
				new MediaCallWebRTCProcessor({
					...config,
					rtc: { ...config.rtc, iceServers: this.iceServers },
					iceGatheringTimeout: this.iceGatheringTimeout
				})
		);

		this.session = mediaSessionStore.getInstance(this.userId);
	}

	public getSession(): MediaSignalingSession | null {
		return this.session;
	}

	public refreshSession(): MediaSignalingSession | null {
		this.session = mediaSessionStore.getInstance(this.userId);
		return this.session;
	}

	public reset(): void {
		if (this.storeTimeoutUnsubscribe) {
			this.storeTimeoutUnsubscribe();
			this.storeTimeoutUnsubscribe = null;
		}
		if (this.storeIceServersUnsubscribe) {
			this.storeIceServersUnsubscribe();
			this.storeIceServersUnsubscribe = null;
		}
		mediaSessionStore.dispose();
		this.session = null;
	}

	private getIceServers(): IceServer[] {
		const iceServers = store.getState().settings.VoIP_TeamCollab_Ice_Servers as string;
		return parseStringToIceServers(iceServers);
	}

	private configureIceServers(): void {
		this.iceServers = this.getIceServers();
		this.iceGatheringTimeout = store.getState().settings.VoIP_TeamCollab_Ice_Gathering_Timeout as number;

		this.storeTimeoutUnsubscribe = store.subscribe(() => {
			const currentTimeout = store.getState().settings.VoIP_TeamCollab_Ice_Gathering_Timeout as number;
			if (currentTimeout !== this.iceGatheringTimeout) {
				this.iceGatheringTimeout = currentTimeout;
				this.session?.setIceGatheringTimeout(this.iceGatheringTimeout);
			}
		});

		this.storeIceServersUnsubscribe = store.subscribe(() => {
			const currentIceServers = this.getIceServers();
			if (currentIceServers !== this.iceServers) {
				this.iceServers = currentIceServers;
			}
		});
	}
}
