import { NewMessageStackParamList } from '../../stacks/types';
import { ISubscription, SubscriptionType } from '../../definitions/ISubscription';
import { IBaseScreen, IMessage, ISearchLocal, IUser } from '../../definitions';
import { TSupportedThemes } from '../../theme';

export interface IResult {
	rid: string;
	t: SubscriptionType;
	prid: string;
}

export interface IError {
	reason: string;
}
export interface ICreateChannelViewProps extends IBaseScreen<NewMessageStackParamList, 'CreateDiscussionView'> {
	server: string;
	user: IUser;
	create: Function;
	loading: boolean;
	result: IResult;
	failure: boolean;
	error: IError;
	isMasterDetail: boolean;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	encryptionEnabled: boolean;
}

export interface ICreateChannelViewState {
	channel: ISubscription | ISearchLocal;
	message: IMessage;
	name?: string;
	users: string[];
	reply: string;
	encrypted: boolean;
}

export interface ICreateDiscussionViewSelectChannel {
	server: string;
	token: string;
	userId: string;
	initial: object;
	onChannelSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	theme: TSupportedThemes;
}

export interface ICreateDiscussionViewSelectUsers {
	server: string;
	token: string;
	userId: string;
	selected: any[];
	onUserSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	theme: TSupportedThemes;
}
