import I18n from '../../i18n';
import { getAppTranslation, stripAppKeyPrefix, type TAppTranslationArgs } from '../../lib/methods/helpers/getAppTranslation';
import { store as reduxStore } from '../../lib/store/auxStore';
import { type IText } from './interfaces';

// Read through the store rather than a selector hook: these run inside UiKitParser
// methods, where an extra hook would change hook counts per element type.
export const translateKey = (key?: string, appId?: string, args?: TAppTranslationArgs): string | undefined => {
	if (!key || !appId || !reduxStore) {
		return undefined;
	}
	const state = reduxStore.getState();
	return getAppTranslation(state?.apps?.languages?.[appId], state?.login?.user?.language, stripAppKeyPrefix(key, appId), args);
};

// Resolution order is load-bearing: apps own their keys, but videoconf-core sends
// i18n keys that only exist in the RN dictionary (Call_ended_bold and friends).
export const translateText = (text?: IText, appId?: string): string => {
	if (!text) {
		return '';
	}
	const key = text.i18n?.key;
	if (key) {
		const fromApp = translateKey(key, appId, text.i18n?.args);
		if (fromApp !== undefined) {
			return fromApp;
		}
		if (I18n.isTranslated(key)) {
			return I18n.t(key);
		}
	}
	return text.text ?? '';
};
