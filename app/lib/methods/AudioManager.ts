import { createAudioPlayer, AudioPlayer, AudioStatus } from 'expo-audio';
import { Q } from '@nozbe/watermelondb';
import moment from 'moment';

import { getMessageById } from '../database/services/Message';
import database from '../database';
import { getFilePathAudio } from './getFilePathAudio';
import { TMessageModel } from '../../definitions';
import { emitter } from './helpers';

function createAudioManager() {
	let audioQueue: { [audioKey: string]: AudioPlayer } = {};
	let audioPlaying = '';
	let audiosRendered = new Set<string>();

	function getAudioKey({ msgId, rid, uri }: { msgId?: string; rid: string; uri: string }) {
		return `${msgId}-${rid}-${uri}`;
	}

	function addAudioRendered(audioKey: string) {
		audiosRendered.add(audioKey);
	}

	function removeAudioRendered(audioKey: string) {
		audiosRendered.delete(audioKey);
	}

	async function loadAudio({ msgId, rid, uri }: { rid: string; msgId?: string; uri: string }): Promise<string> {
		const audioKey = getAudioKey({ msgId, rid, uri });
		addAudioRendered(audioKey);
		if (audioQueue[audioKey]) return audioKey;

		const sound = createAudioPlayer({ uri });
		audioQueue[audioKey] = sound;
		return audioKey;
	}

	async function playAudio(audioKey: string) {
		if (audioPlaying) await pauseAudio();
		audioQueue[audioKey]?.play();
		audioPlaying = audioKey;
		emitter.emit('audioFocused', audioKey);
	}

	async function pauseAudio() {
		if (audioPlaying) {
			audioQueue[audioPlaying]?.pause();
			audioPlaying = '';
		}
	}

	async function setPositionAsync(audioKey: string, time: number) {
		audioQueue[audioKey]?.seekTo(time);
	}

	async function setRateAsync(audioKey: string, value = 1.0) {
		try {
			audioQueue[audioKey]?.setPlaybackRate(value);
		} catch {}
	}

	function onPlaybackStatusUpdate(audioKey: string, status: AudioStatus, callback: (status: AudioStatus) => void) {
		if (status) {
			callback(status);
			onEnd(audioKey, status);
		}
	}

	function setOnPlaybackStatusUpdate(audioKey: string, callback: (status: AudioStatus) => void): void {
		audioQueue[audioKey]?.addListener('playbackStatusUpdate', status => {
			onPlaybackStatusUpdate(audioKey, status, callback);
		});
	}

	async function onEnd(audioKey: string, status: AudioStatus) {
		if (status.isLoaded && status.didJustFinish) {
			try {
				audioQueue[audioKey].release();
				audioPlaying = '';
				emitter.emit('audioFocused', '');
				await playNextAudioInSequence(audioKey);
			} catch {}
		}
	}

	function getNextAudioKey({ message, rid }: { message: TMessageModel; rid: string }) {
		if (!message.attachments) return;
		const { audio_url: audioUrl, audio_type: audioType } = message.attachments[0];
		const uri = getFilePathAudio({ audioUrl, audioType });
		if (!uri) return;
		return getAudioKey({ msgId: message.id, rid, uri });
	}

	async function getNextAudioMessage(msgId: string, rid: string) {
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

	async function playNextAudioInSequence(previousAudioKey: string) {
		const [msgId, rid] = previousAudioKey.split('-');
		const nextMessage = await getNextAudioMessage(msgId, rid);
		if (nextMessage && nextMessage.attachments) {
			const nextAudioInSeqKey = getNextAudioKey({ message: nextMessage, rid });
			if (nextAudioInSeqKey && audioQueue[nextAudioInSeqKey] && audiosRendered.has(nextAudioInSeqKey)) {
				await playAudio(nextAudioInSeqKey);
			}
		}
	}

	async function unloadRoomAudios(rid?: string) {
		if (!rid) return;
		const regExp = new RegExp(rid);
		const roomAudioKeysLoaded = Object.keys(audioQueue).filter(audioKey => regExp.test(audioKey));
		const roomAudiosLoaded = roomAudioKeysLoaded.map(key => audioQueue[key]);
		try {
			await Promise.all(roomAudiosLoaded.map(async audio => audio?.release()));
		} catch {}
		roomAudioKeysLoaded.forEach(key => delete audioQueue[key]);
		audioPlaying = '';
	}

	return {
		playAudio,
		pauseAudio,
		setPositionAsync,
		setRateAsync,
		onEnd,
		unloadRoomAudios,
		playNextAudioInSequence,
		getNextAudioKey,
		getNextAudioMessage,
		addAudioRendered,
		removeAudioRendered,
		loadAudio,
		onPlaybackStatusUpdate,
		setOnPlaybackStatusUpdate
	};
}

export default createAudioManager();
