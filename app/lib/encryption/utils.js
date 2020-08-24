import ByteBuffer from 'bytebuffer';
import SimpleCrypto from 'react-native-simple-crypto';

import random from '../../utils/random';

export const b64ToBuffer = SimpleCrypto.utils.convertBase64ToArrayBuffer;
export const utf8ToBuffer = SimpleCrypto.utils.convertUtf8ToArrayBuffer;
export const bufferToB64 = SimpleCrypto.utils.convertArrayBufferToBase64;
// SimpleCrypto.utils.convertArrayBufferToUtf8 is not working with unicode emoji
export const bufferToUtf8 = (buffer) => {
	const uintArray = new Uint8Array(buffer);
	const encodedString = String.fromCharCode.apply(null, uintArray);
	const decodedString = decodeURIComponent(escape(encodedString));
	return decodedString;
};
export const splitVectorData = (text) => {
	const vector = text.slice(0, 16);
	const data = text.slice(16);
	return [vector, data];
};
export const joinVectorData = (vector, data) => {
	const output = new Uint8Array(vector.byteLength + data.byteLength);
	output.set(new Uint8Array(vector), 0);
	output.set(new Uint8Array(data), vector.byteLength);
	return output.buffer;
};
export const toString = (thing) => {
	if (typeof thing === 'string') {
		return thing;
	}
	// eslint-disable-next-line new-cap
	return new ByteBuffer.wrap(thing).toString('binary');
};
export const randomPassword = () => `${ random(3) }-${ random(3) }-${ random(3) }`.toLowerCase();
