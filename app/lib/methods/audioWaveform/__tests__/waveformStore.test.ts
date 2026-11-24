jest.mock('../../helpers/log', () => jest.fn());

type TStore = typeof import('../waveformStore');

const mockDecode = jest.fn();

jest.mock('react-native-audio-api', () => ({
	decodeAudioData: (...args: unknown[]) => mockDecode(...args)
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
	});

	it('decodes a file once for every view showing it and notifies each view', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		const message = jest.fn();
		const quote = jest.fn();
		store.subscribeWaveform('file:///a.m4a', message);
		store.subscribeWaveform('file:///a.m4a', quote);

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

		pending.get('file:///a.m4a')?.resolve(loudSamples);
		await flush();

		expect(mockDecode).toHaveBeenCalledTimes(1);
		expect(store.getWaveform('file:///b.m4a')).toBeUndefined();
	});

	it('caches a failed decode as no waveform and does not retry it', async () => {
		const pending = deferredDecodes();
		const store = loadStore();
		const unsubscribe = store.subscribeWaveform('file:///a.webm', jest.fn());
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
		pending.get('file:///a.m4a')?.resolve([0.5]);
		await flush();

		expect(store.getWaveform('file:///a.m4a')).toEqual([]);
	});
});
