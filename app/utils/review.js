import { Alert, Linking } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';

import { isIOS, getBundleId } from './deviceInfo';
import I18n from '../i18n';

const reviewKey = 'reviewKey';
const popupDelay = 2000;

// handle official and experimental app
const id = getBundleId.includes('reactnative') ? '1272915472' : '1148741252';
const link = isIOS ? `https://itunes.apple.com/app/id${ id }?action=write-review` : `market://details?id=${ getBundleId }`;

const daysBetween = (date1, date2) => {
	const one_day = 1000 * 60 * 60 * 24;
	const date1_ms = date1.getTime();
	const date2_ms = date2.getTime();
	const difference_ms = date2_ms - date1_ms;
	return Math.round(difference_ms / one_day);
};

const onPress = async() => {
	await RNUserDefaults.setObjectForKey(reviewKey, { doneReview: true });
	Linking.openURL(link);
};

const handlePositiveEvent = () => {
	Alert.alert(
		I18n.t('Are_you_enjoying_this_app'),
		I18n.t('Give_us_some_love_on_the_store', { store: isIOS ? 'App' : 'Play' }),
		[
			{ text: I18n.t('Ask_me_later'), onPress: () => RNUserDefaults.setObjectForKey(reviewKey, { lastReview: new Date().getTime().toString() }) },
			{
				text: I18n.t('Cancel'),
				onPress: () => RNUserDefaults.setObjectForKey(reviewKey, { doneReview: true }),
				style: 'Cancel'
			},
			{ text: I18n.t('Sure'), onPress }
		]
	);
};

export const review = async() => {
	const reviewData = await RNUserDefaults.objectForKey(reviewKey) || { lastReview: '0', doneReview: false };
	const { lastReview, doneReview } = reviewData;
	const lastReviewDate = new Date(parseInt(lastReview, 10));

	if (daysBetween(lastReviewDate, new Date()) >= 1 && !doneReview) {
		setTimeout(handlePositiveEvent, popupDelay);
	}
};
