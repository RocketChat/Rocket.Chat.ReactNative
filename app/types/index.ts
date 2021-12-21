import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';

export interface BaseScreen {
	navigation: StackNavigationProp<any>;
	dispatch: Dispatch;
	theme: string;
}

export * from './redux';
