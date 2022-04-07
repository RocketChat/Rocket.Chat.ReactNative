export enum MessageTypeLoad {
	MORE = 'load_more',
	PREVIOUS_CHUNK = 'load_previous_chunk',
	NEXT_CHUNK = 'load_next_chunk'
}

export const MESSAGE_TYPE_ANY_LOAD = [MessageTypeLoad.MORE, MessageTypeLoad.PREVIOUS_CHUNK, MessageTypeLoad.NEXT_CHUNK];
