import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { clearInAppFeedback, removeInAppFeedback } from '../../../actions/inAppFeedback';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import UserPreferences from '../../../lib/methods/userPreferences';
import { NOTIFICATION_IN_APP_VIBRATION } from '../../../lib/constants/notifications';

const fireHapticFeedback = () => {
	const notificationInAppVibration = UserPreferences.getBool(NOTIFICATION_IN_APP_VIBRATION);
	if (notificationInAppVibration || notificationInAppVibration === null) {
		try {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
		} catch {
			// Do nothing: Haptic is unavailable
		}
	}
};

export function useInAppFeedback(): void {
	'use memo';

	const dispatch = useDispatch();
	const isFocused = useIsFocused();
	const inAppFeedback = useAppSelector(state => state.inAppFeedback);

	useEffect(() => {
		dispatch(clearInAppFeedback());
		return () => {
			dispatch(clearInAppFeedback());
		};
	}, [dispatch]);

	useEffect(() => {
		if (!isFocused) {
			return;
		}
		const msgIds = Object.keys(inAppFeedback);
		if (!msgIds.length) {
			return;
		}
		msgIds.forEach(msgId => dispatch(removeInAppFeedback(msgId)));
		fireHapticFeedback();
	}, [dispatch, isFocused, inAppFeedback]);
}
