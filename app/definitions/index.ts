import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';

export * from './IAttachment';
export * from './INotification';
export * from './IPreferences';
export * from './ISubscription';
export * from './IRoom';
export * from './IMessage';
export * from './IThread';
export * from './IThreadMessage';
export * from './ICustomEmoji';
export * from './IFrequentlyUsedEmoji';
export * from './IUpload';
export * from './ISettings';
export * from './IRole';
export * from './IPermission';
export * from './ISlashCommand';
export * from './IUser';
export * from './IServer';
export * from './ILoggedUser';
export * from './IServerHistory';
export * from './IRocketChat';
export * from './ICertificate';
export * from './IUrl';

export interface IBaseScreen<T extends Record<string, object | undefined>, S extends string> {
	navigation: StackNavigationProp<T, S>;
	route: RouteProp<T, S>;
	dispatch: Dispatch;
	theme: string;
}

export * from './redux';
export * from './redux/TRootEnum';
