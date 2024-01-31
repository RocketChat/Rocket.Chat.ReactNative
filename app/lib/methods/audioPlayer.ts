import { AVPlaybackStatus, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Q } from '@nozbe/watermelondb';
import moment from 'moment';

import { getMessageById } from '../database/services/Message';
import database from '../database';
import { getFilePathAudio } from './getFilePathAudio';
import EventEmitter from './helpers/events';
import { store } from '../store/auxStore';
import { getUserSelector } from '../../selectors/login';
import { TMessageModel } from '../../definitions';

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
	private audiosRendered: Set<string>;

	constructor() {
		this.audioQueue = {};
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
		this.addAudioRendered(audioKey);
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

	getNextAudioKey = ({ message, rid }: { message: TMessageModel; rid: string }) => {
		if (!message.attachments) {
			return;
		}
		const { audio_url: audioUrl, audio_type: audioType } = message.attachments[0];
		const baseUrl = store.getState().server.server;
		const cdnPrefix = store.getState().settings.CDN_PREFIX as string;
		const { id: userId, token } = getUserSelector(store.getState());
		const uri = getFilePathAudio({ audioUrl, audioType, baseUrl, cdnPrefix, userId, token });
		if (!uri) {
			return;
		}
		return getAudioKey({
			msgId: message.id,
			rid,
			uri
		});
	};

	async playNextAudioInSequence(previousAudioKey: string) {
		const [msgId, rid] = previousAudioKey.split('-');
		const msg = await getMessageById(msgId);
		if (msg) {
			const db = database.active;
			const whereClause = [
				Q.experimentalSortBy('ts', Q.asc),
				Q.where('ts', Q.gt(moment(msg.ts).valueOf())),
				Q.experimentalTake(1)
			] as (Q.WhereDescription | Q.Or)[];

			if (msg.tlm || msg.tmid) {
				const [message] = await db
					.get('messages')
					.query(Q.where('tmid', msg.tmid || msg.id), ...whereClause)
					.fetch();
				if (message && message.attachments) {
					const nextAudioInSeqKey = this.getNextAudioKey({ message, rid });
					if (nextAudioInSeqKey && this.audioQueue?.[nextAudioInSeqKey] && this.audiosRendered.has(nextAudioInSeqKey)) {
						await this.playAudio(nextAudioInSeqKey);
						return;
					}
				}
			}

			const [message] = await db
				.get('messages')
				.query(Q.where('rid', rid), ...whereClause)
				.fetch();
			if (message && message.attachments) {
				const nextAudioInSeqKey = this.getNextAudioKey({ message, rid });
				if (nextAudioInSeqKey && this.audioQueue?.[nextAudioInSeqKey] && this.audiosRendered.has(nextAudioInSeqKey)) {
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
