import { Emitter } from '@rocket.chat/emitter';
import { MediaSignalingSession, MediaCallWebRTCProcessor } from '@rocket.chat/media-signaling';
import type { MediaSignalTransport, ClientMediaSignal, WebRTCProcessorConfig } from '@rocket.chat/media-signaling';
import { mediaDevices } from 'react-native-webrtc';
import BackgroundTimer from 'react-native-background-timer';

import { MediaCallLogger } from './MediaCallLogger';

type SignalTransport = MediaSignalTransport<ClientMediaSignal>;

const randomStringFactory = (): string =>
	Date.now().toString(36) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

class MediaSessionStore extends Emitter<{ change: void }> {
	private sessionInstance: MediaSignalingSession | null = null;
	private sendSignalFn: SignalTransport | null = null;
	private _webrtcProcessorFactory: ((config: WebRTCProcessorConfig) => MediaCallWebRTCProcessor) | null = null;

	private change() {
		this.emit('change');
	}

	public onChange(callback: () => void) {
		return this.on('change', callback);
	}

	private webrtcProcessorFactory(config: WebRTCProcessorConfig): MediaCallWebRTCProcessor {
		if (!this._webrtcProcessorFactory) {
			throw new Error('WebRTC processor factory not set');
		}
		return this._webrtcProcessorFactory(config);
	}

	private sendSignal(signal: ClientMediaSignal) {
		if (!this.sendSignalFn) {
			throw new Error('Send signal function not set');
		}
		return this.sendSignalFn(signal);
	}

	private makeInstance(userId: string): MediaSignalingSession | null {
		if (this.sessionInstance !== null) {
			this.sessionInstance.endSession();
			this.sessionInstance = null;
		}

		if (!this._webrtcProcessorFactory || !this.sendSignalFn) {
			throw new Error('WebRTC processor factory and send signal function must be set');
		}

		this.sessionInstance = new MediaSignalingSession({
			userId,
			transport: (signal: ClientMediaSignal) => this.sendSignal(signal),
			processorFactories: {
				webrtc: (config: WebRTCProcessorConfig) => this.webrtcProcessorFactory(config)
			},
			mediaStreamFactory: (constraints: any) => mediaDevices.getUserMedia(constraints) as unknown as Promise<MediaStream>,
			randomStringFactory,
			logger: new MediaCallLogger(),
			timerProcessor: {
				setInterval: (callback: () => void, interval: number) => BackgroundTimer.setInterval(callback, interval),
				clearInterval: (interval: number) => BackgroundTimer.clearInterval(interval),
				setTimeout: (callback: () => void, timeout: number) => BackgroundTimer.setTimeout(callback, timeout),
				clearTimeout: (timeout: number) => BackgroundTimer.clearTimeout(timeout)
			}
		});

		this.change();
		return this.sessionInstance;
	}

	public getInstance(userId?: string): MediaSignalingSession | null {
		if (!userId) {
			throw new Error('User Id is required');
		}

		if (this.sessionInstance?.userId === userId) {
			return this.sessionInstance;
		}

		return this.makeInstance(userId);
	}

	public setSendSignalFn(sendSignalFn: SignalTransport) {
		this.sendSignalFn = sendSignalFn;
		this.change();
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
