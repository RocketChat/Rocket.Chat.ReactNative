import { createAudioPlayer, setAudioModeAsync, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { Q } from '@nozbe/watermelondb';

import dayjs from '../dayjs';
import { getMessageById } from '../database/services/Message';
import database from '../database';
import { getFilePathAudio } from './getFilePathAudio';
import { type TMessageModel } from '~/definitions/IMessage';
import { emitter } from './helpers/emitter';
import log from './helpers/log';
import { AUDIO_MODE } from '../constants/audio';
import { useNowPlayingAudioStore, type INowPlayingAudio } from './useNowPlayingAudioStore';

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
	private detachedAudioKeys: Set<string>;

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
		this.detachedAudioKeys = new Set<string>();
	}

	private get nowPlaying() {
		return useNowPlayingAudioStore.getState().audio;
	}

	private updateNowPlaying(changes: Partial<INowPlayingAudio>) {
		const { nowPlaying } = this;
		if (nowPlaying) {
			useNowPlayingAudioStore.setState({ audio: { ...nowPlaying, ...changes } });
		}
	}

	private clearNowPlaying() {
		useNowPlayingAudioStore.setState({ audio: null });
	}

	private startNowPlaying(audioKey: string) {
		const player = this.audioQueue[audioKey];
		useNowPlayingAudioStore.setState({
			audio: {
				audioKey,
				rid: this.audioMeta[audioKey].rid,
				msgId: this.audioMeta[audioKey].msgId,
				playing: true,
				currentTime: player?.currentTime ?? 0,
				duration: player?.duration ?? 0
			}
		});
	}

	private releasePlayer(audioKey: string) {
		this.audioSubscriptions[audioKey]?.();
		delete this.audioSubscriptions[audioKey];
		try {
			this.audioQueue[audioKey]?.release();
		} catch (error) {
			log(error);
		}
		delete this.audioQueue[audioKey];
	}

	private releaseAudio(audioKey: string) {
		this.releasePlayer(audioKey);
		delete this.audioCallbacks[audioKey];
		delete this.audioUris[audioKey];
		delete this.audioPositions[audioKey];
		delete this.audioRates[audioKey];
		delete this.audioMeta[audioKey];
		this.detachedAudioKeys.delete(audioKey);
	}

	private releaseIfDetached(audioKey: string) {
		if (this.detachedAudioKeys.has(audioKey)) {
			this.releaseAudio(audioKey);
		}
	}

	private subscribeToStatus(audioKey: string) {
		this.audioSubscriptions[audioKey]?.();
		const sub = this.audioQueue[audioKey]?.addListener('playbackStatusUpdate', status => {
			this.onPlaybackStatusUpdate(audioKey, status);
		});
		if (sub) this.audioSubscriptions[audioKey] = () => sub.remove?.();
	}

	addAudioRendered = (audioKey: string) => {
		this.audiosRendered.add(audioKey);
	};

	removeAudioRendered = (audioKey: string) => {
		this.audiosRendered.delete(audioKey);
	};

	loadAudio({ msgId, rid, uri }: { rid: string; msgId?: string; uri: string }): string {
		const audioKey = getAudioKey({ msgId, rid, uri });
		this.audioUris[audioKey] = uri;
		this.audioMeta[audioKey] = { msgId, rid };
		this.detachedAudioKeys.delete(audioKey);
		if (this.audioQueue[audioKey]) {
			return audioKey;
		}

		const sound = createAudioPlayer({ uri });
		this.audioQueue[audioKey] = sound;
		return audioKey;
	}

	async playAudio(audioKey: string) {
		if (!this.audioQueue[audioKey] && !this.audioUris[audioKey]) {
			return;
		}

		if (this.audioPlaying) {
			this.pauseAudio();
		}

		const previousAudioKey = this.nowPlaying?.audioKey;
		if (previousAudioKey && previousAudioKey !== audioKey) {
			this.releaseIfDetached(previousAudioKey);
		}

		// If player was released, recreate it
		if (!this.audioQueue[audioKey] && this.audioUris[audioKey]) {
			const sound = createAudioPlayer({ uri: this.audioUris[audioKey] });
			this.audioQueue[audioKey] = sound;

			if (this.audioPositions[audioKey] !== undefined) {
				await sound.seekTo(this.audioPositions[audioKey]);
			}

			this.subscribeToStatus(audioKey);
		}

		try {
			await setAudioModeAsync(AUDIO_MODE);
			if (!this.audioQueue[audioKey]) {
				return;
			}
			this.audioPlaying = audioKey;
			this.setRate(audioKey, this.audioRates[audioKey]);
			this.audioQueue[audioKey].play();
			if (this.audioMeta[audioKey]?.msgId) {
				this.startNowPlaying(audioKey);
			} else {
				this.clearNowPlaying();
			}
			emitter.emit('audioFocused', audioKey);
		} catch (error) {
			log(error);
		}
	}

	pauseAudio(): void {
		if (this.audioPlaying) {
			this.audioQueue[this.audioPlaying]?.pause();
			if (this.nowPlaying?.audioKey === this.audioPlaying) {
				this.updateNowPlaying({ playing: false });
			}
			this.audioPlaying = '';
		}
	}

	async closeAudio() {
		const audioKey = this.nowPlaying?.audioKey;
		if (!audioKey) {
			return;
		}
		this.pauseAudio();
		this.clearNowPlaying();
		emitter.emit('audioFocused', '');
		if (this.detachedAudioKeys.has(audioKey)) {
			this.releaseAudio(audioKey);
			return;
		}
		await this.setPositionAsync(audioKey, 0);
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

	onPlaybackStatusUpdate(audioKey: string, status: AudioStatus): void {
		if (!status) {
			return;
		}
		this.audioCallbacks[audioKey]?.(status);
		if (this.nowPlaying?.audioKey === audioKey && status.isLoaded) {
			this.updateNowPlaying({ playing: status.playing, currentTime: status.currentTime, duration: status.duration });
		}
		this.onEnd(audioKey, status);
	}

	setOnPlaybackStatusUpdate(audioKey: string, callback: (status: AudioStatus) => void): void {
		this.audioCallbacks[audioKey] = callback;
		this.subscribeToStatus(audioKey);
		const status = this.audioQueue[audioKey]?.currentStatus;
		if (status && this.nowPlaying?.audioKey === audioKey) {
			callback(status);
		}
	}

	async onEnd(audioKey: string, status: AudioStatus): Promise<void> {
		if (!this.audioQueue[audioKey]) {
			return;
		}

		if (status.isLoaded && status.didJustFinish) {
			try {
				if (this.detachedAudioKeys.has(audioKey)) {
					this.releaseAudio(audioKey);
				} else {
					this.releasePlayer(audioKey);
					this.audioPositions[audioKey] = 0;
				}
				if (this.audioPlaying === audioKey) {
					this.audioPlaying = '';
				}
				if (this.nowPlaying?.audioKey === audioKey) {
					this.clearNowPlaying();
				}
				emitter.emit('audioFocused', '');
				await this.playNextAudioInSequence(audioKey);
			} catch (error) {
				log(error);
			}
		}
	}

	getNextAudioKey = ({ message, rid }: { message: TMessageModel; rid: string }) => {
		if (!message.attachments) {
			return;
		}
		const { audio_url: audioUrl, audio_type: audioType } = message.attachments[0];
		const uri = getFilePathAudio({ audioUrl, audioType });
		if (!uri) {
			return;
		}
		return getAudioKey({
			msgId: message.id,
			rid,
			uri
		});
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
		const [msgId, rid] = previousAudioKey.split('-');
		const nextMessage = await this.getNextAudioMessage(msgId, rid);
		if (nextMessage && nextMessage.attachments) {
			const nextAudioInSeqKey = this.getNextAudioKey({ message: nextMessage, rid });
			if (nextAudioInSeqKey && this.audioUris[nextAudioInSeqKey] && this.audiosRendered.has(nextAudioInSeqKey)) {
				await this.playAudio(nextAudioInSeqKey);
			}
		}
	}

	unloadRoomAudios(rid?: string): void {
		if (!rid) {
			return;
		}
		const nowPlayingAudioKey = this.nowPlaying?.audioKey;
		const roomAudioKeys = Object.keys(this.audioMeta).filter(audioKey => this.audioMeta[audioKey].rid === rid);
		roomAudioKeys.forEach(audioKey => {
			this.audiosRendered.delete(audioKey);
			if (audioKey === nowPlayingAudioKey) {
				this.detachedAudioKeys.add(audioKey);
				delete this.audioCallbacks[audioKey];
				return;
			}
			this.releaseAudio(audioKey);
		});
	}
}

const AudioManager = new AudioManagerClass();
export default AudioManager;
