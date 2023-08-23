import { AVPlaybackStatus, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Sound } from 'expo-av/build/Audio/Sound';

const mode = {
	allowsRecordingIOS: false,
	playsInSilentModeIOS: true,
	staysActiveInBackground: true,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: InterruptionModeIOS.DoNotMix,
	interruptionModeAndroid: InterruptionModeAndroid.DoNotMix
};

class HandleAudioMedia {
	private audioQueue: { [uri: string]: Sound };
	private audioPlaying: string;

	constructor() {
		this.audioQueue = {};
		this.audioPlaying = '';
	}

	async loadAudio(uri: string): Promise<Sound> {
		if (this.audioQueue[uri]) {
			return this.audioQueue[uri];
		}
		const { sound } = await Audio.Sound.createAsync({ uri });
		this.audioQueue[uri] = sound;
		return sound;
	}

	onPlaybackStatusUpdate(uri: string, status: AVPlaybackStatus, callback: (status: AVPlaybackStatus) => void) {
		if (status) {
			callback(status);
			this.onEnd(uri, status);
		}
	}

	async onEnd(uri: string, status: AVPlaybackStatus) {
		if (status.isLoaded) {
			if (status.didJustFinish) {
				try {
					await this.audioQueue[uri]?.stopAsync();
					this.audioPlaying = '';
				} catch {
					// do nothing
				}
			}
		}
	}

	setOnPlaybackStatusUpdate(uri: string, callback: (status: AVPlaybackStatus) => void): void {
		return this.audioQueue[uri]?.setOnPlaybackStatusUpdate(status => this.onPlaybackStatusUpdate(uri, status, callback));
	}

	async playAudio(uri: string) {
		if (this.audioPlaying) {
			await this.pauseAudio(this.audioPlaying);
		}
		await Audio.setAudioModeAsync(mode);
		await this.audioQueue[uri]?.playAsync();
		this.audioPlaying = uri;
	}

	async pauseAudio(uri: string) {
		await this.audioQueue[uri]?.pauseAsync();
		this.audioPlaying = '';
	}

	async setPositionAsync(uri: string, time: number) {
		try {
			await this.audioQueue[uri]?.setPositionAsync(time);
		} catch {
			// Do nothing
		}
	}

	async setRateAsync(uri: string, value = 1.0) {
		await this.audioQueue[uri].setRateAsync(value, true);
	}

	async unloadAudio(uri: string) {
		await this.audioQueue[uri]?.stopAsync();
		await this.audioQueue[uri]?.unloadAsync();
		delete this.audioQueue[uri];
		this.audioPlaying = '';
	}

	async unloadAllAudios() {
		const audiosLoaded = Object.values(this.audioQueue);
		try {
			await Promise.all(
				audiosLoaded.map(async audio => {
					await audio?.stopAsync();
					await audio?.unloadAsync();
				})
			);
		} catch {
			// Do nothing
		}
		this.audioPlaying = '';
		this.audioQueue = {};
	}
}

const handleAudioMedia = new HandleAudioMedia();
export default handleAudioMedia;
