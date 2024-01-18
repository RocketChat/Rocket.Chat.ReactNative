import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef } from 'react';
import { Subscription } from 'rxjs';
import { Q } from '@nozbe/watermelondb';
import * as Haptics from 'expo-haptics';

import database from '../../../lib/database';
import { useAppSelector } from '../../../lib/hooks';
import { getUserSelector } from '../../../selectors/login';
import { useUserPreferences } from '../../../lib/methods';
import { NOTIFICATION_IN_APP_VIBRATION } from '../../../lib/constants';

const HapticFeedback = ({ rid, tmid }: { rid?: string; tmid?: string }) => {
	const subscription = useRef<Subscription | null>(null);
	const focused = useRef(false);
	const navigation = useNavigation();
	const userId = useAppSelector(state => getUserSelector(state).id);
	const [notificationInAppVibration] = useUserPreferences<boolean>(NOTIFICATION_IN_APP_VIBRATION, true);

	const initHaptic = () => {
		if (!rid) {
			return;
		}
		const db = database.active;
		let observable;
		if (!tmid) {
			observable = db
				.get('messages')
				.query(
					Q.and(
						Q.where('rid', rid),
						Q.or(Q.where('tmid', null), Q.where('tshow', Q.eq(true))),
						Q.where('u', Q.notLike(`%${userId}%`))
					)
				)
				.observeCount();
		} else {
			observable = db
				.get('thread_messages')
				.query(Q.where('rid', tmid), Q.where('u', Q.notLike(`%${userId}%`)))
				.observeCount();
		}

		// TODO: Update watermelonDB to recognize experimentalSubscribe at types
		// experimentalSubscribe(subscriber: (isDeleted: boolean) => void, debugInfo?: any): Unsubscribe
		// @ts-ignore
		subscription.current = observable.subscribe(async () => {
			if (focused.current) {
				if (notificationInAppVibration || notificationInAppVibration === null) {
					await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
					console.log('🚀 ~ RoomSubscription ~ Haptics:', 'Haptics');
				}
			}
			focused.current = true;
		});
	};

	useEffect(() => {
		const unsubscribeFocus = navigation.addListener('focus', () => {
			initHaptic();
		});

		const unsubscribeBlur = navigation.addListener('blur', () => {
			subscription.current?.unsubscribe && subscription.current.unsubscribe();
			focused.current = false;
		});

		return () => {
			unsubscribeFocus();
			unsubscribeBlur();
		};
	}, [navigation]);

	return null;
};

export default HapticFeedback;
