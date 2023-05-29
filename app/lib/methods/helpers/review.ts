import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import I18n from '../../../i18n';
import { isFDroidBuild, STORE_REVIEW_LINK } from '../../constants';
import { showErrorAlert } from './info';
import { isIOS } from './deviceInfo';
import { events, logEvent } from './log';

const store = isIOS ? 'App Store' : 'Play Store';

const reviewKey = 'reviewKey';
const reviewDelay = 2000;
const numberOfDays = 7;
const numberOfPositiveEvent = 5;

const daysBetween = (date1: Date, date2: Date): number => {
	const one_day = 1000 * 60 * 60 * 24;
	const date1_ms = date1.getTime();
	const date2_ms = date2.getTime();
	const difference_ms = date2_ms - date1_ms;
	return Math.round(difference_ms / one_day);
};

const onCancelPress = () => {
	try {
		const data = JSON.stringify({ doneReview: true });
		return AsyncStorage.setItem(reviewKey, data);
	} catch (e) {
		// do nothing
	}
};

export const onReviewPress = async (): Promise<void> => {
	logEvent(events.SE_REVIEW_THIS_APP);
	await onCancelPress();
	try {
		const supported = await Linking.canOpenURL(STORE_REVIEW_LINK);
		if (supported) {
			Linking.openURL(STORE_REVIEW_LINK);
		}
	} catch (e) {
		logEvent(events.SE_REVIEW_THIS_APP_F);
		showErrorAlert(I18n.t('Review_app_unable_store', { store }));
	}
};

const onAskMeLaterPress = () => {
	try {
		const data = JSON.stringify({ lastReview: new Date().getTime() });
		return AsyncStorage.setItem(reviewKey, data);
	} catch (e) {
		// do nothing
	}
};

const onReviewButton = { text: I18n.t('Review_app_yes'), onPress: onReviewPress };
const onAskMeLaterButton = { text: I18n.t('Review_app_later'), onPress: onAskMeLaterPress };
const onCancelButton = { text: I18n.t('Review_app_no'), onPress: onCancelPress };

const askReview = () =>
	Alert.alert(
		I18n.t('Review_app_title'),
		I18n.t('Review_app_desc', { store }),
		isIOS ? [onReviewButton, onAskMeLaterButton, onCancelButton] : [onAskMeLaterButton, onCancelButton, onReviewButton],
		{
			cancelable: true,
			onDismiss: onAskMeLaterPress
		}
	);

const tryReview = async () => {
	const data = (await AsyncStorage.getItem(reviewKey)) || '{}';
	const reviewData = JSON.parse(data);
	const { lastReview = 0, doneReview = false } = reviewData;
	const lastReviewDate = new Date(lastReview);

	// if ask me later was pressed earlier, we can ask for review only after {{numberOfDays}} days
	// if there's no review and it wasn't dismissed by the user
	if (daysBetween(lastReviewDate, new Date()) >= numberOfDays && !doneReview) {
		setTimeout(askReview, reviewDelay);
	}
};

class ReviewApp {
	positiveEventCount = 0;

	pushPositiveEvent = () => {
		if (isFDroidBuild || process.env.RUNNING_E2E_TESTS === 'true') {
			return;
		}
		if (this.positiveEventCount >= numberOfPositiveEvent) {
			return;
		}
		this.positiveEventCount += 1;
		if (this.positiveEventCount === numberOfPositiveEvent) {
			tryReview();
		}
	};
}

export const Review = new ReviewApp();
