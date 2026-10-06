import { parse } from '@rocket.chat/message-parser';

import { UiKitMessage } from './index';

export const warmUpMessageBlocks = (): void => {
	UiKitMessage([]);
	parse('*warm up*');
};
