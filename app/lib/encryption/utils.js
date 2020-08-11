/* eslint-disable new-cap, no-proto */
import ByteBuffer from 'bytebuffer';
import SimpleCrypto from 'react-native-simple-crypto';
import { NativeModules } from 'react-native';

import random from '../../utils/random';

export const { jwkToPkcs1 } = NativeModules.Encryption;
export const b64ToBuffer = SimpleCrypto.utils.convertBase64ToArrayBuffer;
export const bufferToUtf8 = SimpleCrypto.utils.convertArrayBufferToUtf8;
export const utf8ToBuffer = SimpleCrypto.utils.convertUtf8ToArrayBuffer;
export const splitVectorData = (text) => {
	const vector = text.slice(0, 16);
	const data = text.slice(16);
	return [vector, data];
};
export const toString = (thing) => {
	if (typeof thing === 'string') {
		return thing;
	}
	return new ByteBuffer.wrap(thing).toString('binary');
};
export const randomPassword = () => `${ random(3) }-${ random(3) }-${ random(3) }`.toLowerCase();
