import { call } from 'redux-saga/effects';

import { hasNativeHeaderBar } from '../lib/methods/helpers';
import log from '../lib/methods/helpers/log';
import { preloadHeaderIcons } from '../lib/methods/helpers/navigation/headerIcon';

export const preloadNativeHeaderIcons = function* preloadNativeHeaderIcons() {
	if (!hasNativeHeaderBar) {
		return;
	}
	try {
		yield call(preloadHeaderIcons);
	} catch (e) {
		log(e);
	}
};
