import { parse, type Options, type Root } from '@rocket.chat/message-parser';
import { createWorkletRuntime, runOnRuntimeAsync, type WorkletRuntime } from 'react-native-worklets';

import log from '~/lib/methods/helpers/log';

let parserRuntime: WorkletRuntime | undefined;

const getParserRuntime = (): WorkletRuntime => {
	parserRuntime ??= createWorkletRuntime({ name: 'message-parser', enableNetworking: false });
	return parserRuntime;
};

export const parseOffThread = (msg: string, options: Options, onParsed: (root: Root | null) => void): void => {
	runOnRuntimeAsync(
		getParserRuntime(),
		(text: string, parseOptions: Options) => {
			'worklet';
			return parse(text, parseOptions);
		},
		msg,
		options
	).then(onParsed, error => {
		log(error);
		onParsed(null);
	});
};
