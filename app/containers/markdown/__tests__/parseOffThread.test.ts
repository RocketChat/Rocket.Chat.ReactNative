import { type Options } from '@rocket.chat/message-parser';

import log from '~/lib/methods/helpers/log';

jest.mock('~/lib/methods/helpers/log', () => jest.fn());

const parseOptions: Options = { emoticons: true };

const loadRealParseOffThread = (worklets: object): typeof import('../parseOffThread') => {
	let parseOffThreadModule: typeof import('../parseOffThread') | undefined;
	jest.isolateModules(() => {
		jest.doMock('react-native-worklets', () => worklets);
		parseOffThreadModule = jest.requireActual<typeof import('../parseOffThread')>('../parseOffThread');
	});
	return parseOffThreadModule!;
};

describe('parseOffThread', () => {
	it('reports a failed parse when the worklet runtime cannot be created', () => {
		const runtimeError = new Error('createWorkletRuntime failed');
		const { parseOffThread } = loadRealParseOffThread({
			createWorkletRuntime: () => {
				throw runtimeError;
			},
			runOnRuntimeAsync: jest.fn()
		});
		const onParsed = jest.fn();

		expect(() => parseOffThread('**hi**', parseOptions, onParsed)).not.toThrow();
		expect(onParsed).toHaveBeenCalledWith(null);
		expect(log).toHaveBeenCalledWith(runtimeError);
	});

	it('reports a failed parse when the runtime rejects the parse', async () => {
		const parseError = new Error('parse failed');
		const { parseOffThread } = loadRealParseOffThread({
			createWorkletRuntime: () => ({}),
			runOnRuntimeAsync: () => Promise.reject(parseError)
		});
		const onParsed = jest.fn();

		parseOffThread('**hi**', parseOptions, onParsed);
		await Promise.resolve();
		await Promise.resolve();

		expect(onParsed).toHaveBeenCalledWith(null);
		expect(log).toHaveBeenCalledWith(parseError);
	});

	it('hands the parsed root to the caller', async () => {
		const root = [{ type: 'PARAGRAPH', value: [] }];
		const { parseOffThread } = loadRealParseOffThread({
			createWorkletRuntime: () => ({}),
			runOnRuntimeAsync: () => Promise.resolve(root)
		});
		const onParsed = jest.fn();

		parseOffThread('hi', parseOptions, onParsed);
		await Promise.resolve();

		expect(onParsed).toHaveBeenCalledWith(root);
	});
});
