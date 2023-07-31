import mitt from 'mitt';

import { TAutocompleteType, TMicOrSend } from './interfaces';

type Events = {
	setMicOrSend: TMicOrSend;
	setAutocomplete: {
		type: TAutocompleteType;
		text: string;
		params?: string;
	};
};

export const emitter = mitt<Events>();

// emitter.on('*', (type, e) => console.log(type, e));
