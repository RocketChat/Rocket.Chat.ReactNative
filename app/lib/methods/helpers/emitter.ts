import mitt from 'mitt';

import { TMarkdownStyle } from '../../../containers/MessageComposer/interfaces';

type Events = {
	toolbarMention: undefined;
	addMarkdown: {
		style: TMarkdownStyle;
	};
};

export const emitter = mitt<Events>();

emitter.on('*', (type, e) => console.log(type, e));
