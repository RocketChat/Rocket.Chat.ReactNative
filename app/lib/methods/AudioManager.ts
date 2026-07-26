import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { Q } from '@nozbe/watermelondb';

import dayjs from '../dayjs';
import { getMessageById } from '../database/services/Message';
import database from '../database';
import { getFilePathAudio } from './getFilePathAudio';
import { type TMessageModel } from '../../definitions';
import { emitter } from './helpers';
import log from './helpers/log';
import { AUDIO_MODE } from '../constants/audio';

const getAudioKey = ({ msgId, rid, uri }: { msgId?: string; rid: string; uri: string }) => `${msgId}-${rid}-${uri}`;

class AudioManagerClass {
	private audioQueue: { [audioKey: string]: AudioPlayer };
	private audioUris: { [audioKey: string]: string };
	private audioPositions: { [audioKey: string]: number };
	private audioRates: { [audioKey: string]: number };
	private audioSubscriptions: { [audioKey: string]: () => void };
	private audioCallbacks: { [audioKey: string]: (status: AudioStatus) => void };
	private audioMeta: { [audioKey: string]: { msgId?: string; rid: string } };
	private audioPlaying: string;
	private audiosRendered: Set<string>;

	constructor() {
		this.audioQueue = {};
		this.audioUris = {};
		this.audioPositions = {};
		this.audioRates = {};
		this.audioSubscriptions = {};
		this.audioCallbacks = {};
		this.audioMeta = {};
		this.audioPlaying = '';
		this.audiosRendered = new Set<string>();
	}

	addAudioRendered = (audioKey: string) => {
		this.audiosRendered.add(audioKey);
	};

	removeAudioRendered = (audioKey: string) => {
		this.audiosRendered.delete(audioKey);
	};

	async loadAudio({ msgId, rid, uri }: { rid: string; msgId?: string; uri: string }): Promise<string> {
		const audioKey = getAudioKey({ msgId, rid, uri });
		this.audioUris[audioKey] = uri;
		this.audioMeta[audioKey] = { msgId, rid };
		if (this.audioQueue[audioKey]) return audioKey;

		const sound = createAudioPlayer({ uri });
		this.audioQueue[audioKey] = sound;
		return audioKey;
	};

	async playAudio(audioKey: string) {
		if (this.audioPlaying && this.audioPlaying !== audioKey) {
			this.pauseAudio();
		}

		try {
			await setAudioModeAsync(AUDIO_MODE);
		} catch {
			// Ignore audio mode errors — playback still attempted below
		}

		// If player was released, recreate it
		if (!this.audioQueue[audioKey] && this.audioUris[audioKey]) {
			const sound = createAudioPlayer({ uri: this.audioUris[audioKey] });
			this.audioQueue[audioKey] = sound;

			if (this.audioRates[audioKey] !== undefined) {
				sound.setPlaybackRate(this.audioRates[audioKey]);
			}

			if (this.audioPositions[audioKey] !== undefined) {
				await sound.seekTo(this.audioPositions[audioKey]);
			}

			// Re-register the callback if it exists
			if (this.audioCallbacks[audioKey]) {
				const sub = sound.addListener('playbackStatusUpdate', status => {
					this.onPlaybackStatusUpdate(audioKey, status, this.audioCallbacks[audioKey]);
				});
				if (sub) this.audioSubscriptions[audioKey] = () => sub.remove?.();
			}
		}

		try {
			this.audioQueue[audioKey]?.play();
			this.audioPlaying = audioKey;
			emitter.emit('audioFocused', audioKey);
		} catch {
			// Ignore playback start errors
		}
	}

	async pauseAudio() {
		if (this.audioPlaying) {
			this.audioQueue[this.audioPlaying]?.pause();
			this.audioPlaying = '';
		}
	};

	async setPositionAsync(audioKey: string, time: number) {
		this.audioPositions[audioKey] = time;
		const player = this.audioQueue[audioKey];
		if (!player) {
			return;
		}
		try {
			await player.seekTo(time);
		} catch {
			// Ignore seek errors
		}
	}

	async setRateAsync(audioKey: string, value = 1.0) {
		this.audioRates[audioKey] = value;
		try {
			this.audioQueue[audioKey]?.setPlaybackRate(value);
		} catch {
			// Ignore errors when setting playback rate
		}
	};

	onPlaybackStatusUpdate(audioKey: string, status: AudioStatus, callback: (status: AudioStatus) => void) {
		if (status) {
			callback(status);
			this.onEnd(audioKey, status);
		}
	}

	setOnPlaybackStatusUpdate(audioKey: string, callback: (status: AudioStatus) => void) {
		this.audioCallbacks[audioKey] = callback;
		this.audioSubscriptions[audioKey]?.();
		const sub = this.audioQueue[audioKey]?.addListener('playbackStatusUpdate', status => {
			this.onPlaybackStatusUpdate(audioKey, status, callback);
		});
		if (sub) this.audioSubscriptions[audioKey] = () => sub.remove?.();
	}

	async onEnd(audioKey: string, status: AudioStatus) {
		if (!this.audioQueue[audioKey]) {
			return;
		}

		if (status.isLoaded && status.didJustFinish) {
			try {
				this.audioSubscriptions[audioKey]?.();
				delete this.audioSubscriptions[audioKey];
				// Don't delete the callback - keep it for replay
				this.audioQueue[audioKey].release();
				delete this.audioQueue[audioKey];
				// Reset position to beginning so audio can be played again
				this.audioPositions[audioKey] = 0;
				this.audioPlaying = '';
				emitter.emit('audioFocused', '');
				await this.playNextAudioInSequence(audioKey);
			} catch {
				// Ignore errors during cleanup
			}
		}
	}

	getNextAudioKey = ({ message, rid }: { message: TMessageModel; rid: string }) => {
		if (!message.attachments) return;
		const { audio_url: audioUrl, audio_type: audioType } = message.attachments[0];
		const uri = getFilePathAudio({ audioUrl, audioType });
		if (!uri) return;
		return getAudioKey({ msgId: message.id, rid, uri });
	};

	async getNextAudioMessage(msgId: string, rid: string) {
		const msg = await getMessageById(msgId);
		if (msg) {
			const db = database.active;
			const whereClause: Q.Clause[] = [Q.sortBy('ts', Q.asc), Q.where('ts', Q.gt(dayjs(msg.ts).valueOf())), Q.take(1)];

			if (msg.tmid) {
				whereClause.push(Q.where('tmid', msg.tmid || msg.id));
			} else {
				whereClause.push(Q.where('rid', rid), Q.where('tmid', null));
			}
			const [message] = await db
				.get('messages')
				.query(...whereClause)
				.fetch();
			return message;
		}
		return null;
	}

	async playNextAudioInSequence(previousAudioKey: string) {
		const meta = this.audioMeta[previousAudioKey];
		if (!meta) {
			return;
		}
		const { msgId, rid } = meta;
		if (!msgId) {
			return;
		}
		const nextMessage = await this.getNextAudioMessage(msgId, rid);
		if (nextMessage && nextMessage.attachments) {
			const nextAudioInSeqKey = this.getNextAudioKey({ message: nextMessage, rid });
			if (nextAudioInSeqKey && this.audioQueue[nextAudioInSeqKey] && this.audiosRendered.has(nextAudioInSeqKey)) {
				await this.playAudio(nextAudioInSeqKey);
			}
		}
	}

	async unloadRoomAudios(rid?: string) {
		if (!rid) return;
		const roomAudioKeysLoaded = Object.keys(this.audioQueue).filter(audioKey => this.audioMeta[audioKey]?.rid === rid);
		const roomAudiosLoaded = roomAudioKeysLoaded.map(key => this.audioQueue[key]);
		try {
			await Promise.all(roomAudiosLoaded.map(audio => audio?.release()));
		} catch (error) {
			log(error);
		}
		roomAudioKeysLoaded.forEach(key => {
			this.audioSubscriptions[key]?.();
			delete this.audioSubscriptions[key];
			delete this.audioCallbacks[key];
			delete this.audioQueue[key];
			delete this.audioUris[key];
			delete this.audioPositions[key];
			delete this.audioRates[key];
			delete this.audioMeta[key];
		});
		this.audioPlaying = '';
	}
}

const AudioManager = new AudioManagerClass();
export default AudioManager;
