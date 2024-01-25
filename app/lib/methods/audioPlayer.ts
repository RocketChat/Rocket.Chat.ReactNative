import { AVPlaybackStatus, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Q } from '@nozbe/watermelondb';
import moment from 'moment';

import { getMessageById } from '../database/services/Message';
import database from '../database';
import { getFilePathAudio } from './getFilePathAudio';

import EventEmitter from './helpers/events';

export const AUDIO_FOCUSED = 'AUDIO_FOCUSED';

const AUDIO_MODE = {
	allowsRecordingIOS: false,
	playsInSilentModeIOS: true,
	staysActiveInBackground: true,
	shouldDuckAndroid: true,
	playThroughEarpieceAndroid: false,
	interruptionModeIOS: InterruptionModeIOS.DoNotMix,
	interruptionModeAndroid: InterruptionModeAndroid.DoNotMix
};

const getAudioKey = ({ msgId, rid, uri }: { msgId?: string; rid: string; uri: string }) => `${msgId}-${rid}-${uri}`;

class AudioPlayer {
	private audioQueue: { [audioKey: string]: Audio.Sound };
	private audioPlaying: string;

	constructor() {
		this.audioQueue = {};
		this.audioPlaying = '';
	}

	async loadAudio({ msgId, rid, uri }: { rid: string; msgId?: string; uri: string }): Promise<string> {
		const audioKey = getAudioKey({ msgId, rid, uri });
		if (this.audioQueue[audioKey]) {
			return audioKey;
		}
		const { sound } = await Audio.Sound.createAsync({ uri }, { androidImplementation: 'MediaPlayer' });
		this.audioQueue[audioKey] = sound;
		return audioKey;
	}

	onPlaybackStatusUpdate(audioKey: string, status: AVPlaybackStatus, callback: (status: AVPlaybackStatus) => void) {
		if (status) {
			callback(status);
			this.onEnd(audioKey, status);
		}
	}

	async onEnd(audioKey: string, status: AVPlaybackStatus) {
		if (status.isLoaded) {
			if (status.didJustFinish) {
				try {
					await this.audioQueue[audioKey]?.stopAsync();
					this.audioPlaying = '';
          EventEmitter.emit(AUDIO_FOCUSED, { audioFocused: '' });

					await this.playNextAudioInSequence(audioKey);
				} catch {
					// do nothing
				}
			}
		}
	}

	setOnPlaybackStatusUpdate(audioKey: string, callback: (status: AVPlaybackStatus) => void): void {
		return this.audioQueue[audioKey]?.setOnPlaybackStatusUpdate(status =>
			this.onPlaybackStatusUpdate(audioKey, status, callback)
		);
	}

	async playAudio(audioKey: string) {
		if (this.audioPlaying) {
			await this.pauseAudio(this.audioPlaying);
		}
		await Audio.setAudioModeAsync(AUDIO_MODE);
		await this.audioQueue[audioKey]?.playAsync();
		this.audioPlaying = audioKey;
		EventEmitter.emit(AUDIO_FOCUSED, { audioFocused: audioKey });
	}

	async playNextAudioInSequence(previousAudioKey: string) {
		const [msgId, rid] = previousAudioKey.split('-');

		const msg = await getMessageById(msgId);

		if (msg) {
			const db = database.active;
			const [message] = await db
				.get('messages')
				.query(
					Q.where('rid', rid),
					Q.experimentalSortBy('ts', Q.asc),
					Q.where('ts', Q.gt(moment(msg.ts).valueOf())),
					Q.experimentalTake(1)
				)
				.fetch();

			if (message && message.attachments) {
				const file = message.attachments[0];
				const nextAudioInSeqKey = getAudioKey({ msgId: message.id, rid, uri: getFilePathAudio(file) });

				if (this.audioQueue?.[nextAudioInSeqKey]) {
					await this.playAudio(nextAudioInSeqKey);
				}
			}
		}
	}

	async pauseAudio(audioKey: string) {
		await this.audioQueue[audioKey]?.pauseAsync();
		this.audioPlaying = '';
	}

	async pauseCurrentAudio() {
		if (this.audioPlaying) {
			await this.pauseAudio(this.audioPlaying);
		}
	}

	async setPositionAsync(audioKey: string, time: number) {
		try {
			await this.audioQueue[audioKey]?.setPositionAsync(time);
		} catch {
			// Do nothing
		}
	}

	async setRateAsync(audioKey: string, value = 1.0) {
		try {
			await this.audioQueue[audioKey].setRateAsync(value, true);
		} catch {
			// Do nothing
		}
	}

	async unloadAudio(audioKey: string) {
		await this.audioQueue[audioKey]?.stopAsync();
		await this.audioQueue[audioKey]?.unloadAsync();
		delete this.audioQueue[audioKey];
		this.audioPlaying = '';
	}

	async unloadCurrentAudio() {
		if (this.audioPlaying) {
			await this.unloadAudio(this.audioPlaying);
		}
	}

	async unloadRoomAudios(rid?: string) {
		if (!rid) {
			return;
		}
		const regExp = new RegExp(rid);
		const roomAudioKeysLoaded = Object.keys(this.audioQueue).filter(audioKey => regExp.test(audioKey));
		const roomAudiosLoaded = roomAudioKeysLoaded.map(key => this.audioQueue[key]);
		try {
			await Promise.all(
				roomAudiosLoaded.map(async audio => {
					await audio?.stopAsync();
					await audio?.unloadAsync();
				})
			);
		} catch {
			// Do nothing
		}
		roomAudioKeysLoaded.forEach(key => delete this.audioQueue[key]);
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

const audioPlayer = new AudioPlayer();
export default audioPlayer;
