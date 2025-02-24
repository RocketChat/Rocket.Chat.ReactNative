import { RouteProp } from '@react-navigation/native';
import { Dispatch } from 'redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TNavigation } from '../stacks/stackType';
import { TColors, TSupportedThemes } from '../theme';

export * from './ERoomType';
export * from './IAttachment';
export * from './ICannedResponse';
export * from './ICertificate';
export * from './ICredentials';
export * from './IEmoji';
export * from './ILivechatDepartment';
export * from './ILivechatTag';
export * from './ILoggedUser';
export * from './IMessage';
export * from './INotification';
export * from './IPermission';
export * from './IPreferences';
export * from './IProfile';
export * from './IReaction';
export * from './IRole';
export * from './IRoom';
export * from './ISearch';
export * from './IServer';
export * from './IServerHistory';
export * from './ISettings';
export * from './ISlashCommand';
export * from './ISubscription';
export * from './IThread';
export * from './IThreadMessage';
export * from './IUpload';
export * from './IUrl';
export * from './IUser';
export * from './redux';
export * from './redux/TRootEnum';
export * from './TChangeAvatarViewContext';
export * from './IDataSelect';
export * from './TUserStatus';

export interface IBaseScreen<T extends Record<string, object | undefined>, S extends string> {
	navigation: NativeStackNavigationProp<T & TNavigation, S>;
	route: RouteProp<T, S>;
	dispatch: Dispatch;
	isMasterDetail: boolean;
	// TODO: remove after migrating all Class components
	theme: TSupportedThemes;
	colors: TColors;
}
