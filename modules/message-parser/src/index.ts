import type { Options, Root } from '@rocket.chat/message-parser';
import { NitroModules } from 'react-native-nitro-modules';

import type { MessageParser } from './specs/MessageParser.nitro';

const messageParser = NitroModules.createHybridObject<MessageParser>('MessageParser');

export const parse = async (input: string, options: Options = {}): Promise<Root> =>
	JSON.parse(await messageParser.parse(input, JSON.stringify(options)));
