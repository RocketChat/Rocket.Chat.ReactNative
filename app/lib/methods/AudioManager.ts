import { AVPlaybackStatus, Audio } from 'expo-av';
import { Q } from '@nozbe/watermelondb';
import moment from 'moment';

import { getMessageById } from '../database/services/Message';
import database from '../database';
import { getFilePathAudio } from './getFilePathAudio';
import { TMessageModel } from '../../definitions';
import { AUDIO_MODE } from '../constants';
import { emitter } from './helpers';

const getAudioKey = ({ msgId, rid, uri }: { msgId?: string; rid: string; uri: string }) => `${msgId}-${rid}-${uri}`;

class AudioManagerClass {
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

	async playAudio(audioKey: string) {
		if (this.audioPlaying) {
			await this.pauseAudio();
		}
		await Audio.setAudioModeAsync(AUDIO_MODE);
		await this.audioQueue[audioKey]?.playAsync();
		this.audioPlaying = audioKey;
		emitter.emit('audioFocused', audioKey);
	}

	async pauseAudio() {
		if (this.audioPlaying) {
			await this.audioQueue[this.audioPlaying]?.pauseAsync();
			this.audioPlaying = '';
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

	onPlaybackStatusUpdate(audioKey: string, status: AVPlaybackStatus, callback: (status: AVPlaybackStatus) => void) {
		if (status) {
			callback(status);
			this.onEnd(audioKey, status);
		}
	}

	setOnPlaybackStatusUpdate(audioKey: string, callback: (status: AVPlaybackStatus) => void): void {
		return this.audioQueue[audioKey]?.setOnPlaybackStatusUpdate(status =>
			this.onPlaybackStatusUpdate(audioKey, status, callback)
		);
	}

	async onEnd(audioKey: string, status: AVPlaybackStatus) {
		if (status.isLoaded && status.didJustFinish) {
			try {
				await this.audioQueue[audioKey]?.stopAsync();
				this.audioPlaying = '';
				emitter.emit('audioFocused', '');
				await this.playNextAudioInSequence(audioKey);
			} catch {
				// do nothing
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
			const whereClause: Q.Clause[] = [Q.sortBy('ts', Q.asc), Q.where('ts', Q.gt(moment(msg.ts).valueOf())), Q.take(1)];

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
			if (nextAudioInSeqKey && this.audioQueue?.[nextAudioInSeqKey] && this.audiosRendered.has(nextAudioInSeqKey)) {
				await this.playAudio(nextAudioInSeqKey);
			}
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
}

const AudioManager = new AudioManagerClass();
export default AudioManager;
