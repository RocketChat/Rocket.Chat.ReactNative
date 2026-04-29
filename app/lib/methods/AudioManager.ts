import { createAudioPlayer, type AudioPlayer, type AudioStatus } from 'expo-audio';
import { Q } from '@nozbe/watermelondb';

import dayjs from '../dayjs';
import { getMessageById } from '../database/services/Message';
import database from '../database';
import { getFilePathAudio } from './getFilePathAudio';
import { type TMessageModel } from '../../definitions';
import { emitter } from './helpers';

function createAudioManager() {
	const audioQueue: { [audioKey: string]: AudioPlayer } = {};
	const audioUris: { [audioKey: string]: string } = {};
	const audioPositions: { [audioKey: string]: number } = {};
	const audioRates: { [audioKey: string]: number } = {};
	const audioSubscriptions: { [audioKey: string]: () => void } = {};
	const audioCallbacks: { [audioKey: string]: (status: AudioStatus) => void } = {};
	let audioPlaying = '';
	const audiosRendered = new Set<string>();

	function getAudioKey({ msgId, rid, uri }: { msgId?: string; rid: string; uri: string }) {
		return `${msgId}-${rid}-${uri}`;
	}

	function addAudioRendered(audioKey: string) {
		audiosRendered.add(audioKey);
	}

	function removeAudioRendered(audioKey: string) {
		audiosRendered.delete(audioKey);
	}

	function loadAudio({ msgId, rid, uri }: { rid: string; msgId?: string; uri: string }): string {
		const audioKey = getAudioKey({ msgId, rid, uri });
		addAudioRendered(audioKey);
		audioUris[audioKey] = uri;
		if (audioQueue[audioKey]) return audioKey;

		const sound = createAudioPlayer({ uri });
		audioQueue[audioKey] = sound;
		return audioKey;
	}

	async function playAudio(audioKey: string) {
		if (audioPlaying && audioPlaying !== audioKey) {
			pauseAudio();
		}

		// If player was released, recreate it
		if (!audioQueue[audioKey] && audioUris[audioKey]) {
			const sound = createAudioPlayer({ uri: audioUris[audioKey] });
			audioQueue[audioKey] = sound;

			if (audioRates[audioKey] !== undefined) {
				sound.setPlaybackRate(audioRates[audioKey]);
			}

			if (audioPositions[audioKey] !== undefined) {
				await sound.seekTo(audioPositions[audioKey]);
			}

			// Re-register the callback if it exists
			if (audioCallbacks[audioKey]) {
				const sub = sound.addListener('playbackStatusUpdate', status => {
					onPlaybackStatusUpdate(audioKey, status, audioCallbacks[audioKey]);
				});
				if (sub) audioSubscriptions[audioKey] = () => sub.remove?.();
			}
		}

		audioQueue[audioKey]?.play();
		audioPlaying = audioKey;
		emitter.emit('audioFocused', audioKey);
	}

	function pauseAudio() {
		if (audioPlaying) {
			audioQueue[audioPlaying]?.pause();
			audioPlaying = '';
		}
	}

	function setPositionAsync(audioKey: string, time: number) {
		audioPositions[audioKey] = time;
		const player = audioQueue[audioKey];
		if (!player) {
			return;
		}
		player.seekTo(time).catch(() => {
			// Ignore seek errors
		});
	}

	function setRateAsync(audioKey: string, value = 1.0) {
		audioRates[audioKey] = value;
		try {
			audioQueue[audioKey]?.setPlaybackRate(value);
		} catch {
			// Ignore errors when setting playback rate
		}
	}

	function onPlaybackStatusUpdate(audioKey: string, status: AudioStatus, callback: (status: AudioStatus) => void) {
		if (status) {
			callback(status);
			onEnd(audioKey, status);
		}
	}

	function setOnPlaybackStatusUpdate(audioKey: string, callback: (status: AudioStatus) => void): void {
		audioCallbacks[audioKey] = callback;
		audioSubscriptions[audioKey]?.();
		const sub = audioQueue[audioKey]?.addListener('playbackStatusUpdate', status => {
			onPlaybackStatusUpdate(audioKey, status, callback);
		});
		if (sub) audioSubscriptions[audioKey] = () => sub.remove?.();
	}

	async function onEnd(audioKey: string, status: AudioStatus) {
		if (!audioQueue[audioKey]) {
			return;
		}

		if (status.isLoaded && status.didJustFinish) {
			try {
				audioSubscriptions[audioKey]?.();
				delete audioSubscriptions[audioKey];
				// Don't delete the callback - keep it for replay
				audioQueue[audioKey].release();
				delete audioQueue[audioKey];
				// Reset position to beginning so audio can be played again
				audioPositions[audioKey] = 0;
				audioPlaying = '';
				emitter.emit('audioFocused', '');
				await playNextAudioInSequence(audioKey);
			} catch {
				// Ignore errors during cleanup
			}
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
			await Promise.all(roomAudiosLoaded.map(audio => audio?.release()));
		} catch (error) {
			console.log(error);
		}
		roomAudioKeysLoaded.forEach(key => {
			audioSubscriptions[key]?.();
			delete audioSubscriptions[key];
			delete audioCallbacks[key];
			delete audioQueue[key];
			delete audioUris[key];
			delete audioPositions[key];
			delete audioRates[key];
		});
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
