import type { TSettingsState, TSettingsValues } from '~/reducers/settings';
import { DEFAULT_QUICK_REPLIES_MAX, DEFAULT_QUICK_REPLY_MAX_LENGTH, QUICK_REPLIES_LIMIT_CEILING } from './constants';

const limitOr = (value: TSettingsValues | undefined, fallback: number): number =>
	typeof value === 'number' && Number.isInteger(value) && value > 0 ? Math.min(value, QUICK_REPLIES_LIMIT_CEILING) : fallback;

export const getQuickRepliesLimits = (settings: TSettingsState) => ({
	max: limitOr(settings.Apple_Watch_Quick_Actions_Max_Count, DEFAULT_QUICK_REPLIES_MAX),
	maxLength: limitOr(settings.Apple_Watch_Quick_Actions_Max_Length, DEFAULT_QUICK_REPLY_MAX_LENGTH)
});
