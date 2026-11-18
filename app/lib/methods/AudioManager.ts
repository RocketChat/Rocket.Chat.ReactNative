import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { Q } from '@nozbe/watermelondb';

import dayjs from '../dayjs';
import { getMessageById } from '../database/services/Message';
import { getThreadMessageById } from '../database/services/ThreadMessage';
import database from '../database';
import { emitter } from './helpers/emitter';
import log from './helpers/log';
import { AUDIO_MODE } from '../constants/audio';

const getAudioKey = ({ msgId, rid, tmid, uri }: { msgId?: string; rid: string; tmid?: string; uri: string }) =>
	`${msgId}-${rid}-${tmid}-${uri}`;

const nextByTs = (ts: string | number | Date) => [Q.where('ts', Q.gt(dayjs(ts).valueOf())), Q.sortBy('ts', Q.asc), Q.take(1)];

class AudioManagerClass {
	private audioQueue: { [audioKey: string]: AudioPlayer };
	private audioUris: { [audioKey: string]: string };
	private audioPositions: { [audioKey: string]: number };
	private audioRates: { [audioKey: string]: number };
	private audioSubscriptions: { [audioKey: string]: () => void };
	private audioCallbacks: { [audioKey: string]: (status: AudioStatus) => void };
	private audioMeta: { [audioKey: string]: { msgId?: string; rid: string; tmid?: string } };
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

	loadAudio({ msgId, rid, tmid, uri }: { rid: string; msgId?: string; tmid?: string; uri: string }): string {
		const audioKey = getAudioKey({ msgId, rid, tmid, uri });
		this.addAudioRendered(audioKey);
		this.audioUris[audioKey] = uri;
		this.audioMeta[audioKey] = { msgId, rid, tmid };
		if (this.audioQueue[audioKey]) {
			return audioKey;
		}

		const sound = createAudioPlayer({ uri });
		this.audioQueue[audioKey] = sound;
		return audioKey;
	}

	async playAudio(audioKey: string) {
		if (this.audioPlaying) {
			this.pauseAudio();
		}

		// If player was released, recreate it
		if (!this.audioQueue[audioKey] && this.audioUris[audioKey]) {
			const sound = createAudioPlayer({ uri: this.audioUris[audioKey] });
			this.audioQueue[audioKey] = sound;

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
			await setAudioModeAsync(AUDIO_MODE);
			this.audioPlaying = audioKey;
			this.setRate(audioKey, this.audioRates[audioKey]);
			this.audioQueue[audioKey]?.play();
			emitter.emit('audioFocused', audioKey);
		} catch (error) {
			log(error);
		}
	}

	pauseAudio(): void {
		if (this.audioPlaying) {
			this.audioQueue[this.audioPlaying]?.pause();
			this.audioPlaying = '';
		}
	}

	async setPositionAsync(audioKey: string, time: number) {
		this.audioPositions[audioKey] = time;
		try {
			await this.audioQueue[audioKey]?.seekTo(time);
		} catch (error) {
			log(error);
		}
	}

	setRate(audioKey: string, value = 1.0): void {
		this.audioRates[audioKey] = value;
		if (!audioKey || this.audioPlaying !== audioKey) {
			return;
		}

		try {
			const player = this.audioQueue[audioKey];
			if (!player) return;
			player.shouldCorrectPitch = true;
			player.setPlaybackRate(value, 'medium');
		} catch (error) {
			log(error);
		}
	}

	onPlaybackStatusUpdate(audioKey: string, status: AudioStatus, callback: (status: AudioStatus) => void): void {
		if (status) {
			callback(status);
			this.onEnd(audioKey, status);
		}
	}

	setOnPlaybackStatusUpdate(audioKey: string, callback: (status: AudioStatus) => void): void {
		this.audioCallbacks[audioKey] = callback;
		this.audioSubscriptions[audioKey]?.();
		const sub = this.audioQueue[audioKey]?.addListener('playbackStatusUpdate', status => {
			this.onPlaybackStatusUpdate(audioKey, status, callback);
		});
		if (sub) this.audioSubscriptions[audioKey] = () => sub.remove?.();
	}

	async onEnd(audioKey: string, status: AudioStatus): Promise<void> {
		if (!this.audioQueue[audioKey]) {
			return;
		}

		if (status.isLoaded && status.didJustFinish) {
			try {
				this.audioSubscriptions[audioKey]?.();
				delete this.audioSubscriptions[audioKey];
				this.audioQueue[audioKey].release();
				delete this.audioQueue[audioKey];
				this.audioPositions[audioKey] = 0;
				this.audioPlaying = '';
				emitter.emit('audioFocused', '');
				await this.playNextAudioInSequence(audioKey);
			} catch (error) {
				log(error);
			}
		}
	}

	findRenderedAudioKey = ({ msgId, rid, tmid }: { msgId: string; rid: string; tmid?: string }) =>
		Object.keys(this.audioMeta).find(audioKey => {
			const meta = this.audioMeta[audioKey];
			return meta.msgId === msgId && meta.rid === rid && meta.tmid === tmid && this.audiosRendered.has(audioKey);
		});

	async getNextThreadAudioMessage(msgId: string, tmid: string) {
		const finishedTs = msgId === tmid ? 0 : (await getThreadMessageById(msgId))?.ts;
		if (finishedTs === undefined) {
			return null;
		}
		const [message] = await database.active
			.get('thread_messages')
			.query(Q.where('rid', tmid), ...nextByTs(finishedTs))
			.fetch();
		return message ?? null;
	}

	async getNextRoomAudioMessage(msgId: string, rid: string) {
		const finished = await getMessageById(msgId);
		if (!finished || finished.tmid) {
			return null;
		}
		const [message] = await database.active
			.get('messages')
			.query(Q.where('rid', rid), Q.where('tmid', null), ...nextByTs(finished.ts))
			.fetch();
		return message ?? null;
	}

	getNextAudioMessage(msgId: string, rid: string, tmid?: string) {
		return tmid ? this.getNextThreadAudioMessage(msgId, tmid) : this.getNextRoomAudioMessage(msgId, rid);
	}

	async playNextAudioInSequence(previousAudioKey: string) {
		const meta = this.audioMeta[previousAudioKey];
		if (!meta?.msgId) {
			return;
		}
		const { msgId, rid, tmid } = meta;
		const nextMessage = await this.getNextAudioMessage(msgId, rid, tmid);
		if (!nextMessage?.attachments?.some(attachment => attachment.audio_url)) {
			return;
		}
		const nextAudioKey = this.findRenderedAudioKey({ msgId: nextMessage.id, rid, tmid });
		if (nextAudioKey) {
			await this.playAudio(nextAudioKey);
		}
	}

	async unloadRoomAudios(rid?: string) {
		if (!rid) {
			return;
		}
		const roomAudioKeysLoaded = Object.keys(this.audioMeta).filter(audioKey => this.audioMeta[audioKey].rid === rid);
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
