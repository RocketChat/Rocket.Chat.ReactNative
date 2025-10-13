import AsyncStorage from '@react-native-async-storage/async-storage';

import dayjs from '../../lib/dayjs';
import { LOCKED_OUT_TIMER_KEY, TIME_TO_LOCK } from '../../lib/constants/localAuthentication';

export const getLockedUntil = async () => {
	const t = await AsyncStorage.getItem(LOCKED_OUT_TIMER_KEY);
	if (t) {
		return dayjs(t).add(TIME_TO_LOCK).toDate();
	}
	return null;
};

export const getDiff = (t: string | number | Date) => new Date(t).getTime() - new Date().getTime();
