import { parse, type Options, type Root } from '@rocket.chat/message-parser';
import { createWorkletRuntime, runOnRuntimeAsync, type WorkletRuntime } from 'react-native-worklets';

import log from '~/lib/methods/helpers/log';

let parserRuntime: WorkletRuntime | undefined;

const getParserRuntime = (): WorkletRuntime => {
	parserRuntime ??= createWorkletRuntime({ name: 'message-parser', enableNetworking: false });
	return parserRuntime;
};

const parseOnRuntime = (msg: string, options: Options): Promise<Root> =>
	runOnRuntimeAsync(
		getParserRuntime(),
		(text: string, parseOptions: Options) => {
			'worklet';
			return parse(text, parseOptions);
		},
		msg,
		options
	);

export const parseOffThread = (msg: string, options: Options, onParsed: (root: Root | null) => void): void => {
	let pendingRoot: Promise<Root>;
	try {
		pendingRoot = parseOnRuntime(msg, options);
	} catch (error) {
		log(error);
		onParsed(null);
		return;
	}
	pendingRoot.then(onParsed, error => {
		log(error);
		onParsed(null);
	});
};
