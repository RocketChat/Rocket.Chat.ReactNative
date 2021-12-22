import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';

export interface BaseScreen {
	navigation: StackNavigationProp<any>;
	dispatch: Dispatch;
	theme: string;
}

export interface IUser {
	_id: string;
	name: string;
	fname: string;
	search?: boolean;
	// username is used when is from searching
	username?: string;
}

type UserStatus = 'online' | 'offline';
export interface ActiveUser {
	status: UserStatus;
	statusText?: string;
}

export * from './redux';
