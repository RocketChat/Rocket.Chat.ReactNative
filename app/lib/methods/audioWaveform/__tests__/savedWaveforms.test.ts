import { type TAppDatabase } from '~/lib/database/interfaces';
import { readSavedWaveform, saveWaveform } from '../savedWaveforms';

const mockRows = new Map<string, { id: string; peaks: number[] }>();

jest.mock('expo-file-system/legacy', () => ({ documentDirectory: 'file:///app/Documents/' }));

jest.mock('@nozbe/watermelondb', () => ({
	...jest.requireActual('@nozbe/watermelondb'),
	Q: { where: (column: string, value: string) => ({ column, value }) }
}));

jest.mock('@nozbe/watermelondb/RawRecord', () => ({ sanitizedRaw: (raw: { id: string }) => raw }));

const collection = {
	schema: {},
	query: ({ value }: { value: string }) => ({
		fetch: async () => (mockRows.has(value) ? [mockRows.get(value)] : [])
	}),
	create: async (build: (record: { _raw: { id: string }; peaks: number[] }) => void) => {
		const record = { _raw: { id: '' }, peaks: [] as number[] };
		build(record);
		mockRows.set(record._raw.id, { id: record._raw.id, peaks: record.peaks });
	}
};

const db = {
	get: () => collection,
	write: (work: () => Promise<void>) => work()
} as unknown as TAppDatabase;

describe('savedWaveforms', () => {
	beforeEach(() => mockRows.clear());

	it('keeps a waveform under the path inside the documents folder', async () => {
		await saveWaveform(db, 'file:///app/Documents/open.rocket.chat/msg1/a.m4a', [0.2, 0.8]);

		expect([...mockRows.keys()]).toEqual(['open.rocket.chat/msg1/a.m4a']);
	});

	it('finds a saved waveform after the documents folder moves', async () => {
		mockRows.set('open.rocket.chat/msg1/a.m4a', { id: 'open.rocket.chat/msg1/a.m4a', peaks: [0.2, 0.8] });

		expect(await readSavedWaveform(db, 'file:///app/Documents/open.rocket.chat/msg1/a.m4a')).toEqual([0.2, 0.8]);
	});

	it('finds nothing for a file never decoded', async () => {
		expect(await readSavedWaveform(db, 'file:///app/Documents/open.rocket.chat/msg1/b.m4a')).toBeUndefined();
	});
});
