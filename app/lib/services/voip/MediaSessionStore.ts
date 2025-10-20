import { Emitter } from '@rocket.chat/emitter';
import { MediaSignalingSession, MediaCallWebRTCProcessor } from '@rocket.chat/media-signaling';
import type { MediaSignalTransport, ClientMediaSignal, WebRTCProcessorConfig } from '@rocket.chat/media-signaling';
import { mediaDevices } from 'react-native-webrtc';
// import BackgroundTimer from 'react-native-background-timer';

import { MediaCallLogger } from './MediaCallLogger';
// import { useIceServers } from './useIceServers';

type SignalTransport = MediaSignalTransport<ClientMediaSignal>;

const randomStringFactory = (): string =>
	Date.now().toString(36) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// const getSessionIdKey = (userId: string): string => `rcx-media-session-id-${userId}`;

class MediaSessionStore extends Emitter<{ change: void }> {
	private sessionInstance: MediaSignalingSession | null = null;
	private sendSignalFn: SignalTransport | null = null;
	private _webrtcProcessorFactory: ((config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor) | null = null;

	private change(): void {
		this.emit('change');
	}

	public onChange(callback: () => void): () => void {
		return this.on('change', callback);
	}

	private webrtcProcessorFactory(config: WebRTCProcessorConfig): MediaCallWebRTCProcessor {
		if (!this._webrtcProcessorFactory) {
			throw new Error('WebRTC processor factory not set');
		}
		return this._webrtcProcessorFactory(config);
	}

	private sendSignal(signal: ClientMediaSignal): void {
		if (this.sendSignalFn) {
			this.sendSignalFn(signal);
			return;
		}

		console.warn('Media Call - Tried to send signal, but no sendSignalFn was set');
	}

	private makeInstance(userId: string): MediaSignalingSession | null {
		if (this.sessionInstance !== null) {
			console.log('ending session', this.sessionInstance);
			this.sessionInstance.endSession();
			this.sessionInstance = null;
		}

		if (!this._webrtcProcessorFactory || !this.sendSignalFn) {
			console.warn('Media Call - Tried to make instance, but no webrtcProcessorFactory or sendSignalFn was set');
			return null;
		}

		this.sessionInstance = new MediaSignalingSession({
			userId,
			transport: (signal: ClientMediaSignal) => this.sendSignal(signal),
			processorFactories: {
				webrtc: (config: WebRTCProcessorConfig) => this.webrtcProcessorFactory(config)
			},
			mediaStreamFactory: (constraints: any) => mediaDevices.getUserMedia(constraints) as unknown as Promise<MediaStream>,
			randomStringFactory,
			logger: new MediaCallLogger()
			// timerProcessor: {
			// 	setInterval: BackgroundTimer.setInterval,
			// 	clearInterval: BackgroundTimer.clearInterval,
			// 	setTimeout: BackgroundTimer.setTimeout,
			// 	clearTimeout: BackgroundTimer.clearTimeout
			// }
		});

		this.change();

		return this.sessionInstance;
	}

	public getInstance(userId?: string): MediaSignalingSession | null {
		if (!userId) {
			console.warn('Media Call - Tried to get instance, but no userId was set');
			return null;
		}

		if (this.sessionInstance?.userId === userId) {
			return this.sessionInstance;
		}

		return this.makeInstance(userId);
	}

	public setSendSignalFn(sendSignalFn: SignalTransport): () => void {
		this.sendSignalFn = sendSignalFn;
		this.change();
		return () => {
			this.sendSignalFn = null;
		};
	}

	public setWebRTCProcessorFactory(factory: (config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor): void {
		this._webrtcProcessorFactory = factory;
		this.change();
	}

	public getCurrentInstance(): MediaSignalingSession | null {
		return this.sessionInstance;
	}
}

// TODO: change name
export const mediaSessionStore = new MediaSessionStore();
