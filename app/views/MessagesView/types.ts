import React from 'react';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ChatsStackParamList } from '../../stacks/types';
import { TNavigation } from '../../stacks/stackType';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import {
	TMessageModel,
	ISubscription,
	SubscriptionType,
	IMessage
} from '../../definitions';

export type TMessagesViewProps = {
	navigation: CompositeNavigationProp<
		NativeStackNavigationProp<ChatsStackParamList, 'MessagesView'>,
		NativeStackNavigationProp<MasterDetailInsideStackParamList & TNavigation>
	>;
	route: RouteProp<ChatsStackParamList, 'MessagesView'>;
	showActionSheet: (params: { options: string[]; hasCancel: boolean }) => void;
}
export type TParams = {
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

export type TMessageViewContent = {
	name: string;
	fetchFunc: () => Promise<any> | any;
	noDataMsg: string;
	testID: string;
	renderItem: (item: any) => React.ReactElement;
	action?: (message: IMessage) => {
		title: string;
		icon: string;
		onPress: () => void;
	};
	handleActionPress?: (message: IMessage) => void;
};