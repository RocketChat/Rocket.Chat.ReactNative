import { TSettingsValues, TSupportedSettings } from '../../reducers/settings';
import { useAppSelector } from './useAppSelector';

export function useSetting<TValue extends TSettingsValues>(key: TSupportedSettings): TValue {
	return useAppSelector(state => state.settings[key]) as TValue;
}
