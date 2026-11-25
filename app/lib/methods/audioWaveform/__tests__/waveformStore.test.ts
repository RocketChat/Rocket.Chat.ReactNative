jest.mock('../../helpers/log', () => jest.fn());

type TStore = typeof import('../waveformStore');

const mockDecode = jest.fn();

jest.mock('react-native-audio-api', () => ({
	decodeAudioData: (...args: unknown[]) => mockDecode(...args)
}));

const mockFileSize = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
	getInfoAsync: async (fileUri: string) => ({ exists: true, size: mockFileSize(fileUri) })
}));

const mockReadSaved = jest.fn();
const mockSave = jest.fn();

jest.mock('../savedWaveforms', () => ({
	readSavedWaveform: (...args: unknown[]) => mockReadSaved(...args),
	saveWaveform: (...args: unknown[]) => mockSave(...args)
}));

const decodedBuffer = (samples: number[]) => ({ getChannelData: () => Float32Array.from(samples) });

const loudSamples = Array.from({ length: 80 }, (_, index) => (index % 2 ? 1 : 0.5));

const deferredDecodes = () => {
	const pending = new Map<string, { resolve: (samples: number[]) => void; reject: (error: Error) => void }>();
	mockDecode.mockImplementation(
		(input: string) =>
			new Promise((resolve, reject) => {
				pending.set(input, { resolve: samples => resolve(decodedBuffer(samples)), reject });
			})
	);
	return pending;
};

const flush = () => new Promise(resolve => setImmediate(resolve));

const loadStore = (): TStore => {
	let store: TStore | undefined;
	jest.isolateModules(() => {
		store = require('../waveformStore');
	});
	return store as TStore;
};

describe('waveformStore', () => {
	beforeEach(() => {
		mockDecode.mockReset();
		mockFileSize.mockReset().mockReturnValue(1024);
		mockReadSaved.mockReset().mockResolvedValue(undefined);
		mockSave.mockReset().mockResolvedValue(undefined);
	});

	it('decodes a file once for every view showing it and notifies each view', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		const message = jest.fn();
		const quote = jest.fn();
		store.subscribeWaveform('file:///a.m4a', message);
		store.subscribeWaveform('file:///a.m4a', quote);

		await flush();
		pending.get('file:///a.m4a')?.resolve(loudSamples);
		await flush();

		expect(mockDecode).toHaveBeenCalledTimes(1);
		expect(message).toHaveBeenCalledTimes(1);
		expect(quote).toHaveBeenCalledTimes(1);
		expect(store.getWaveform('file:///a.m4a')).toHaveLength(40);
	});

	it('decodes one file at a time', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		store.subscribeWaveform('file:///a.m4a', jest.fn());
		store.subscribeWaveform('file:///b.m4a', jest.fn());
		await flush();
		expect(mockDecode.mock.calls.map(([input]) => input)).toEqual(['file:///a.m4a']);

		pending.get('file:///a.m4a')?.resolve(loudSamples);
		await flush();

		expect(mockDecode.mock.calls.map(([input]) => input)).toEqual(['file:///a.m4a', 'file:///b.m4a']);
	});

	it('skips a queued file once every view showing it is gone', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		store.subscribeWaveform('file:///a.m4a', jest.fn());
		const unsubscribe = store.subscribeWaveform('file:///b.m4a', jest.fn());
		unsubscribe();
		await flush();

		pending.get('file:///a.m4a')?.resolve(loudSamples);
		await flush();

		expect(mockDecode).toHaveBeenCalledTimes(1);
		expect(store.getWaveform('file:///b.m4a')).toBeUndefined();
	});

	it('caches a failed decode as no waveform and does not retry it', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		const unsubscribe = store.subscribeWaveform('file:///a.webm', jest.fn());
		await flush();
		pending.get('file:///a.webm')?.reject(new Error('unsupported format'));
		await flush();
		unsubscribe();

		store.subscribeWaveform('file:///a.webm', jest.fn());

		expect(store.getWaveform('file:///a.webm')).toEqual([]);
		expect(mockDecode).toHaveBeenCalledTimes(1);
	});

	it('treats audio too short for one sample per bar as no waveform', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		store.subscribeWaveform('file:///a.m4a', jest.fn());
		await flush();
		pending.get('file:///a.m4a')?.resolve([0.5]);
		await flush();

		expect(store.getWaveform('file:///a.m4a')).toEqual([]);
	});

	it('saves a decoded waveform', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		store.subscribeWaveform('file:///a.m4a', jest.fn());
		await flush();
		pending.get('file:///a.m4a')?.resolve(loudSamples);
		await flush();

		expect(mockSave).toHaveBeenCalledWith('file:///a.m4a', store.getWaveform('file:///a.m4a'));
	});

	it('shows a saved waveform without decoding the file', async () => {
		const saved = Array.from({ length: 40 }, () => 0.5);
		mockReadSaved.mockResolvedValue(saved);
		const store = loadStore();
		const listener = jest.fn();
		store.subscribeWaveform('file:///a.m4a', listener);
		await flush();

		expect(mockDecode).not.toHaveBeenCalled();
		expect(listener).toHaveBeenCalledTimes(1);
		expect(store.getWaveform('file:///a.m4a')).toBe(saved);
	});

	it('does not decode or save a file over 2 MiB', async () => {
		mockFileSize.mockReturnValue(2 * 1024 * 1024 + 1);
		const store = loadStore();
		store.subscribeWaveform('file:///long.m4a', jest.fn());
		await flush();

		expect(mockDecode).not.toHaveBeenCalled();
		expect(mockSave).not.toHaveBeenCalled();
		expect(store.getWaveform('file:///long.m4a')).toEqual([]);
	});

	it('does not save a failed decode', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		store.subscribeWaveform('file:///a.webm', jest.fn());
		await flush();
		pending.get('file:///a.webm')?.reject(new Error('unsupported format'));
		await flush();

		expect(mockSave).not.toHaveBeenCalled();
	});

	it('still decodes and shows the waveform when the database fails', async () => {
		mockReadSaved.mockRejectedValue(new Error('database closed'));
		mockSave.mockRejectedValue(new Error('database closed'));
		const pending = deferredDecodes();
		const store = loadStore();
		store.subscribeWaveform('file:///a.m4a', jest.fn());
		await flush();
		pending.get('file:///a.m4a')?.resolve(loudSamples);
		await flush();

		expect(store.getWaveform('file:///a.m4a')).toHaveLength(40);
	});
});
