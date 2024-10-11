import { IBaseScreen, TSubscriptionModel, TThreadModel } from "../../definitions";
import { Filter } from "./filters";
import { ChatsStackParamList } from "../../stacks/types";
import { TSupportedThemes } from "../../theme";


export interface IThreadMessagesViewState {
	loading: boolean;
	end: boolean;
	messages: any[];
	displayingThreads: TThreadModel[];
	subscription: TSubscriptionModel;
	currentFilter: Filter;
	isSearching: boolean;
	searchText: string;
	offset: number;
}

export interface IThreadMessagesViewProps extends IBaseScreen<ChatsStackParamList, 'ThreadMessagesView'> {
	user: { id: string };
	baseUrl: string;
	useRealName: boolean;
	theme: TSupportedThemes;
	isMasterDetail: boolean;
}

