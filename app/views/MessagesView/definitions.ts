import { type CompositeNavigationProp, type RouteProp } from '@react-navigation/core';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type ChatsStackParamList } from '../../stacks/types';
import { type TNavigation } from '../../stacks/stackType';
import { type MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import { type TMessageModel, type ISubscription, type SubscriptionType } from '../../definitions';

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
