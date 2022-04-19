import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Dispatch } from 'redux';

import { TColors, TSupportedThemes } from '../theme';

export * from './IAttachment';
export * from './INotification';
export * from './IPreferences';
export * from './ISubscription';
export * from './IRoom';
export * from './IMessage';
export * from './IThread';
export * from './IThreadMessage';
export * from './IEmoji';
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
export * from './ICredentials';
export * from './ISearch';
export * from './TUserStatus';

export interface IBaseScreen<T extends Record<string, object | undefined>, S extends string> {
	navigation: StackNavigationProp<T, S>;
	route: RouteProp<T, S>;
	dispatch: Dispatch;
	isMasterDetail: boolean;
	// TODO: remove after migrating all Class components
	theme: TSupportedThemes;
	colors: TColors;
}

export * from './redux';
export * from './redux/TRootEnum';
