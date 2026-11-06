import I18n from '~/i18n';
import BackgroundContainer from '~/containers/BackgroundContainer';
import { Filter } from '../filters';

const emptyTextKeys: Record<Filter, string> = {
	[Filter.All]: 'No_threads',
	[Filter.Following]: 'No_threads_following',
	[Filter.Unread]: 'No_threads_unread'
};

interface IEmptyThreads {
	currentFilter: Filter;
	loading: boolean;
}

const EmptyThreads = ({ currentFilter, loading }: IEmptyThreads) => (
	<BackgroundContainer text={I18n.t(emptyTextKeys[currentFilter])} loading={loading} />
);

export default EmptyThreads;
