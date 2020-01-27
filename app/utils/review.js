import { Alert, Linking } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';

import { isIOS, getBundleId } from './deviceInfo';
import I18n from '../i18n';
import { showErrorAlert } from './info';

const store = isIOS ? 'App' : 'Play';

const reviewKey = 'reviewKey';
const popupDelay = 2000;
const numberOfDays = 7;
const positiveEvent = 5;

// handle official and experimental app
const id = getBundleId.includes('reactnative') ? '1272915472' : '1148741252';
const link = isIOS ? `itms-apps://itunes.apple.com/app/id${ id }?action=write-review` : `market://details?id=${ getBundleId }`;

const daysBetween = (date1, date2) => {
	const one_day = 1000 * 60 * 60 * 24;
	const date1_ms = date1.getTime();
	const date2_ms = date2.getTime();
	const difference_ms = date2_ms - date1_ms;
	return Math.round(difference_ms / one_day);
};

const onCancelPress = () => RNUserDefaults.setObjectForKey(reviewKey, { doneReview: true });

export const onReviewPress = async() => {
	await onCancelPress();
	try {
		const supported = await Linking.canOpenURL(link);
		if (supported) {
			Linking.openURL(link);
		}
	} catch (e) {
		showErrorAlert(I18n.t('Unable_to_open_store', { store }));
	}
};

const onAskMeLaterPress = () => RNUserDefaults.setObjectForKey(reviewKey, { lastReview: new Date().getTime() });

const handlePositiveEvent = () => Alert.alert(
	I18n.t('Are_you_enjoying_this_app'),
	I18n.t('Give_us_some_love_on_the_store', { store }),
	[
		{ text: I18n.t('Ask_me_later'), onPress: onAskMeLaterPress },
		{ text: I18n.t('Cancel'), onPress: onCancelPress, style: 'Cancel' },
		{ text: I18n.t('Sure'), onPress: onReviewPress }
	]
);

export const review = async() => {
	const reviewData = await RNUserDefaults.objectForKey(reviewKey) || {};
	const { lastReview = 0, doneReview = false, positiveEventCount = 0 } = reviewData;
	const lastReviewDate = new Date(lastReview);

	const newPositiveEventCount = positiveEventCount + 1;
	RNUserDefaults.setObjectForKey(reviewKey, { ...reviewData, positiveEventCount: newPositiveEventCount });

	// if ask me later was pressed, we only can show again after {{numberOfDays}} days
	// if {{positiveEvents}} events was triggered
	// if review wasn't done yet or wasn't cancelled
	if (daysBetween(lastReviewDate, new Date()) >= numberOfDays && newPositiveEventCount >= positiveEvent && !doneReview) {
		setTimeout(handlePositiveEvent, popupDelay);
	}
};
