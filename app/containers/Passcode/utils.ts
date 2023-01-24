import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

import { LOCKED_OUT_TIMER_KEY, TIME_TO_LOCK } from '../../lib/constants';

export const getLockedUntil = async () => {
	const t = await AsyncStorage.getItem(LOCKED_OUT_TIMER_KEY);
	if (t) {
		return moment(t).add(TIME_TO_LOCK).toDate();
	}
	return null;
};

export const getDiff = (t: string | number | Date) => new Date(t).getTime() - new Date().getTime();
