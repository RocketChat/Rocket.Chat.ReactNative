import { IBaseScreen, TSubscriptionModel, TThreadModel } from "../../definitions";
import { Filter } from "./filters";
import { ChatsStackParamList } from "../../stacks/types";
import { TSupportedThemes } from "../../theme";


export type ISearchThreadMessages = {
	isSearching: boolean;
	searchText: string;
};

export type IThreadMessagesViewState = {
	loading: boolean;
	end: boolean;
	messages: any[];
	displayingThreads: TThreadModel[];
	subscription: TSubscriptionModel;
	currentFilter: Filter;
	search: ISearchThreadMessages;
	offset: number;
};

export type IThreadMessagesViewProps = IBaseScreen<ChatsStackParamList, 'ThreadMessagesView'> & {
	user: { id: string };
	baseUrl: string;
	useRealName: boolean;
	theme: TSupportedThemes;
	isMasterDetail: boolean;
};


export type IThreadAction =
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_END'; payload: boolean }
	| { type: 'SET_MESSAGES'; payload: any[] } 
	| { type: 'SET_DISPLAYING_THREADS'; payload: TThreadModel[] } 
	| { type: 'SET_SUBSCRIPTION'; payload: TSubscriptionModel } 
	| { type: 'SET_FILTER'; payload: Filter } 
	| { type: 'SET_SEARCH'; payload: ISearchThreadMessages }
	| { type: 'SET_OFFSET'; payload: number };
