import mitt from 'mitt';

import { TAutocompleteType } from './interfaces';

type Events = {
	setAutocomplete: {
		type: TAutocompleteType;
		text: string;
		params?: string;
	};
};

export const emitter = mitt<Events>();

// emitter.on('*', (type, e) => console.log(type, e));
