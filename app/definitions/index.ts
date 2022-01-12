import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';

export * from './IAttachment';
export * from './IMessage';
export * from './INotification';
export * from './IRoom';
export * from './IServer';
export * from './ISubscription';

export interface IBaseScreen<T extends Record<string, object | undefined>, S extends string> {
	navigation: StackNavigationProp<T, S>;
	route: RouteProp<T, S>;
	dispatch: Dispatch;
	theme: string;
}

export * from './redux';
