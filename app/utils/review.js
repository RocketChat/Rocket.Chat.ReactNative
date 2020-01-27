import { Alert, Linking } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';
import * as StoreReview from 'expo-store-review';

import { isIOS, getBundleId, getReadableVersion } from './deviceInfo';
import I18n from '../i18n';

const lastReviewKey = 'lastReviewKey';
const appVersionKey = 'appVersionKey';
const popupDelay = 2000;

const daysBetween = (date1, date2) => {
	const one_day = 1000 * 60 * 60 * 24;
	const date1_ms = date1.getTime();
	const date2_ms = date2.getTime();
	const difference_ms = date2_ms - date1_ms;
	return Math.round(difference_ms / one_day);
};

const onPress = async() => {
	await RNUserDefaults.set(appVersionKey, getReadableVersion);
	if (isIOS) {
		StoreReview.requestReview();
	} else {
		Linking.openURL(`market://details?id=${ getBundleId }`);
	}
};

const handlePositiveEvent = () => {
	Alert.alert(
		I18n.t('Are_you_enjoying_this_app'),
		I18n.t('Give_us_some_love_on_the_store', { store: isIOS ? 'App' : 'Play' }),
		[
			{ text: I18n.t('Ask_me_later'), onPress: () => RNUserDefaults.set(lastReviewKey, new Date().getTime().toString()) },
			{
				text: I18n.t('Cancel'),
				onPress: () => RNUserDefaults.set(appVersionKey, getReadableVersion),
				style: 'Cancel'
			},
			{ text: I18n.t('Sure'), onPress }
		]
	);
};

export const review = async() => {
	const lastReview = await RNUserDefaults.get(lastReviewKey) || '0';
	const lastReviewDate = new Date(parseInt(lastReview, 10));
	const appVersion = await RNUserDefaults.get(appVersionKey) || '0';

	if (daysBetween(lastReviewDate, new Date()) >= 1 && appVersion !== getReadableVersion) {
		setTimeout(handlePositiveEvent, popupDelay);
	}
};
