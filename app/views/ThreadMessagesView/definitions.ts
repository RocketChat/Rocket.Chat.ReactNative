import React from 'react';

import { IBaseScreen, TSubscriptionModel, TThreadModel } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';
import { TSupportedThemes } from '../../theme';

export interface ISearchThreadMessages {
	isSearching: boolean;
	searchText: string;
}

export interface IUseThreadMessages {
	subscription: TSubscriptionModel;
	messages: TThreadModel[];
	displayingThreads: TThreadModel[];
	loadMore: {
		(...args: any[]): void;
		stop(): void;
	};
	loading: boolean;
	setDisplayingThreads: (value: React.SetStateAction<TThreadModel[]>) => void;
	subscribeMessages: ({ subscription, searchText }: { subscription?: TSubscriptionModel; searchText?: string }) => void;
}

export interface IThreadMessagesViewProps extends IBaseScreen<ChatsStackParamList, 'ThreadMessagesView'> {}
