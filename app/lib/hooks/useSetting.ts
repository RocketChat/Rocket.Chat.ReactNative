import { type TSettingsValues, type TSupportedSettings } from '../../reducers/settings';
import { useAppSelector } from './useAppSelector';

export function useSetting(key: TSupportedSettings): TSettingsValues {
	return useAppSelector(state => state.settings[key]) as TSettingsValues;
}
