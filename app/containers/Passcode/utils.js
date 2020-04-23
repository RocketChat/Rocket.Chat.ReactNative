import AsyncStorage from '@react-native-community/async-storage';
import moment from 'moment';

import { LOCKED_OUT_TIMER_KEY, TIME_TO_LOCK } from '../../constants/localAuthentication';

export const getLockedUntil = async() => {
	const t = await AsyncStorage.getItem(LOCKED_OUT_TIMER_KEY);
	if (t) {
		return moment(t).add(TIME_TO_LOCK);
	}
	return null;
};

export const getDiff = t => new Date(t) - new Date();
