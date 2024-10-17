import React from "react";

import { Filter } from "./filters";
import { IBaseScreen, TSubscriptionModel, TThreadModel } from "../../definitions";
import { ChatsStackParamList } from "../../stacks/types";
import { TSupportedThemes } from "../../theme";


export type TSearchThreadMessages = {
	isSearching: boolean;
	searchText: string;
};

export type TUseThreadMessagesProps = {
	rid: string;
	getFilteredThreads: (messages: TThreadModel[], subscription?: TSubscriptionModel, currentFilter?: Filter) => TThreadModel[];
	search: TSearchThreadMessages;
	currentFilter: Filter;
	initFilter: () => void;
	viewName: string;
};

export type TUSeThreadMessages = {
	subscription: TSubscriptionModel;
	messages: TThreadModel[];
	displayingThreads: TThreadModel[];
	loadMore: {
		(...args: any[]): void;
		stop(): void;
	};
	loading: boolean;
	setDisplayingThreads: (value: React.SetStateAction<TThreadModel[]>) => void;
	subscribeMessages: ({ subscription, searchText }: {
		subscription?: TSubscriptionModel;
		searchText?: string;
	}) => void;
};

export type IThreadMessagesViewProps = IBaseScreen<ChatsStackParamList, 'ThreadMessagesView'> & {
	user: { id: string };
	baseUrl: string;
	useRealName: boolean;
	theme: TSupportedThemes;
	isMasterDetail: boolean;
};



