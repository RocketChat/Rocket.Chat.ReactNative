import { type RouteProp } from '@react-navigation/native';
import { type Dispatch } from 'redux';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type TNavigation } from '../stacks/stackType';
import { type TColors, type TSupportedThemes } from '../theme';

export interface IBaseScreen<T extends Record<string, object | undefined>, S extends string> {
	navigation: NativeStackNavigationProp<T & TNavigation, S>;
	route: RouteProp<T, S>;
	dispatch: Dispatch;
	isMasterDetail: boolean;
	// TODO: remove after migrating all Class components
	theme: TSupportedThemes;
	colors: TColors;
}
