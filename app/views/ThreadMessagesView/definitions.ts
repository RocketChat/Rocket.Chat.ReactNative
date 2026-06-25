import { type IBaseScreen } from '../../definitions';
import { type ChatsStackParamList } from '../../stacks/types';

export interface ISearchThreadMessages {
	isSearching: boolean;
	searchText: string;
}

export interface IThreadMessagesViewProps extends IBaseScreen<ChatsStackParamList, 'ThreadMessagesView'> {}
