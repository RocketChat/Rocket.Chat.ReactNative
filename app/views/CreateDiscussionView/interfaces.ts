import { NewMessageStackParamList } from '../../stacks/types';
import { SubscriptionType } from '../../definitions/ISubscription';
import { IBaseScreen } from '../../definitions';

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
	user: {
		id: string;
		token: string;
	};
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

export interface ICreateDiscussionViewSelectChannel {
	server: string;
	token: string;
	userId: string;
	initial: object;
	onChannelSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	theme: string;
}

export interface ICreateDiscussionViewSelectUsers {
	server: string;
	token: string;
	userId: string;
	selected: any[];
	onUserSelect: Function;
	blockUnauthenticatedAccess: boolean;
	serverVersion: string;
	theme: string;
}
