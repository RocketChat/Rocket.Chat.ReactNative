import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';

export interface IBaseScreen<T extends Record<string, object | undefined>, S extends string> {
	navigation: StackNavigationProp<T, S>;
	dispatch: Dispatch;
	theme: string;
}

export * from './redux';
