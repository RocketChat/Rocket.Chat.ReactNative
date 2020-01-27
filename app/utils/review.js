import { Alert } from 'react-native';
import RNUserDefaults from 'rn-user-defaults';
import * as StoreReview from 'expo-store-review';

const lastReviewKey = 'lastReviewKey';
const popupDelay = 2000;

const daysBetween = (date1, date2) => {
	const one_day = 1000 * 60 * 60 * 24;
	const date1_ms = date1.getTime();
	const date2_ms = date2.getTime();
	const difference_ms = date2_ms - date1_ms;
	return Math.round(difference_ms / one_day);
};

const handlePositiveEvent = () => {
	Alert.alert(
		'Are you enjoying this app?',
		'Give us some love on the Play Store',
		[
			{ text: 'Ask me later', onPress: () => RNUserDefaults.set(lastReviewKey, new Date().getTime().toString()) },
			{ text: 'Sure!', onPress: StoreReview.requestReview }
		]
	);
};

export const review = async() => {
	const lastReview = await RNUserDefaults.get(lastReviewKey) || 0;
	const lastReviewDate = new Date(parseInt(lastReview, 10));

	if (daysBetween(lastReviewDate, new Date()) >= 1) {
		setTimeout(handlePositiveEvent, popupDelay);
	}
};
