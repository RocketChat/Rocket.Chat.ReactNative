import { IUser, TSubscriptionModel, TThreadModel } from "../../../definitions";
import { Filter } from "../filters";

const getFilteredThreads = (
    user: IUser,
    messages: TThreadModel[],
    subscription?: TSubscriptionModel,
    currentFilter?: Filter
): TThreadModel[] => {
    if (currentFilter === Filter.Following) {
        return messages.filter(item => item?.replies?.find(u => u === user.id));
    }
    if (currentFilter === Filter.Unread) {
        return messages?.filter(item => subscription?.tunread?.includes(item?.id));
    }
    return messages;
};

export default getFilteredThreads;