import { CompositeNavigationProp, RouteProp } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChatsStackParamList } from '../../stacks/types';
import { TNavigation } from '../../stacks/stackType';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { TMessageModel, ISubscription, SubscriptionType } from '../../definitions';

export interface IMessagesViewProps {
	navigation: CompositeNavigationProp<
		NativeStackNavigationProp<ChatsStackParamList, 'MessagesView'>,
		NativeStackNavigationProp<MasterDetailInsideStackParamList & TNavigation>
	>;
	route: RouteProp<ChatsStackParamList, 'MessagesView'>;
}

export interface IParams {
	rid: string;
	t: SubscriptionType;
	tmid?: string;
	message?: TMessageModel;
	name?: string;
	fname?: string;
	prid?: string;
	room?: ISubscription;
	jumpToMessageId?: string;
	jumpToThreadId?: string;
	roomUserId?: string;
}
