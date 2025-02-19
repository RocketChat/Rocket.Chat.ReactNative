import { IBaseScreen } from '../../definitions';
import { ChatsStackParamList } from '../../stacks/types';

export interface ISearchThreadMessages {
	isSearching: boolean;
	searchText: string;
}

export interface IThreadMessagesViewProps extends IBaseScreen<ChatsStackParamList, 'ThreadMessagesView'> {}
