import mitt from 'mitt';

import { TAutocompleteType, TMarkdownStyle } from './interfaces';

type Events = {
	setAutocomplete: {
		type: TAutocompleteType;
		text: string;
		params?: string;
	};
	toolbarMention: undefined;
	addMarkdown: {
		style: TMarkdownStyle;
	};
};

export const emitter = mitt<Events>();

emitter.on('*', (type, e) => console.log(type, e));
