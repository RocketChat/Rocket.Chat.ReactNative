import { Q } from '@nozbe/watermelondb';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { documentDirectory } from 'expo-file-system/legacy';

import database from '~/lib/database';
import { AUDIO_WAVEFORMS_TABLE } from '~/lib/database/model/AudioWaveform';

const waveformId = (fileUri: string) =>
	documentDirectory && fileUri.startsWith(documentDirectory) ? fileUri.slice(documentDirectory.length) : fileUri;

export const readSavedWaveform = async (fileUri: string): Promise<number[] | undefined> => {
	const [saved] = await database.active
		.get(AUDIO_WAVEFORMS_TABLE)
		.query(Q.where('id', waveformId(fileUri)))
		.fetch();
	return saved?.peaks;
};

export const saveWaveform = async (fileUri: string, peaks: number[]): Promise<void> => {
	const db = database.active;
	const collection = db.get(AUDIO_WAVEFORMS_TABLE);
	await db.write(async () => {
		await collection.create(record => {
			record._raw = sanitizedRaw({ id: waveformId(fileUri) }, collection.schema);
			record.peaks = peaks;
		});
	});
};
