import { IUser, TSubscriptionModel, TThreadModel } from '../../../definitions';
import { Filter } from '../filters';

const getFilteredThreads = (
	user: IUser,
	threads: TThreadModel[],
	subscription?: TSubscriptionModel,
	currentFilter?: Filter
): TThreadModel[] => {
	if (currentFilter === Filter.Following) {
		return threads.filter(item => item?.replies?.find(u => u === user.id));
	}
	if (currentFilter === Filter.Unread) {
		return threads?.filter(item => subscription?.tunread?.includes(item?.id));
	}
	return threads;
};

export default getFilteredThreads;
