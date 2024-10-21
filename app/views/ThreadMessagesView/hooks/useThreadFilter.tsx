import { useCallback } from 'react';
import I18n from 'i18n-js';

import { Filter } from '../filters';
import UserPreferences from '../../../lib/methods/userPreferences';
import { showActionSheetRef } from '../../../containers/ActionSheet';
import { CustomIcon } from '../../../containers/CustomIcon';
import { IUser, TSubscriptionModel, TThreadModel } from '../../../definitions';
import getFilteredThreads from '../utils/getFilteredThreads';

const THREADS_FILTER = 'threadsFilter';

interface IUseThreadFilter {
	user: IUser;
	messages: TThreadModel[];
	subscription: TSubscriptionModel;
	currentFilter: Filter;
	setCurrentFilter: (filter: Filter) => void;
	setDisplayingThreads: (threads: TThreadModel[]) => void;
}

const useThreadFilter = ({
	user,
	messages,
	subscription,
	currentFilter,
	setCurrentFilter,
	setDisplayingThreads
}: IUseThreadFilter) => {
	const initFilter = () => {
		const savedFilter = UserPreferences.getString(THREADS_FILTER);
		if (savedFilter) {
			setCurrentFilter(savedFilter as Filter);
		}
	};

	const onFilterSelected = useCallback(
		(filter: Filter) => {
			const displayingThreads = getFilteredThreads(user, messages, subscription, filter);
			setCurrentFilter(filter);
			setDisplayingThreads(displayingThreads);
			UserPreferences.setString(THREADS_FILTER, filter);
		},
		[messages, subscription]
	);

	const showFilters = () => {
		showActionSheetRef({
			options: [
				{
					title: I18n.t(Filter.All),
					right: currentFilter === Filter.All ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.All)
				},
				{
					title: I18n.t(Filter.Following),
					right: currentFilter === Filter.Following ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.Following)
				},
				{
					title: I18n.t(Filter.Unread),
					right: currentFilter === Filter.Unread ? () => <CustomIcon name='check' size={24} /> : undefined,
					onPress: () => onFilterSelected(Filter.Unread)
				}
			]
		});
	};

	return {
		currentFilter,
		initFilter,
		showFilters
	};
};

export default useThreadFilter;
