import { TSubscriptionModel } from "../../definitions";
import { IThreadMessagesViewState, IThreadAction } from "./types";
import { Filter } from "./filters";

const threadMessagesInitialState: IThreadMessagesViewState = {
    loading: false,
    end: false,
    messages: [],
    displayingThreads: [],
    subscription: {} as TSubscriptionModel,
    currentFilter: Filter.All,
    search: {
        isSearching: false,
        searchText: ''
    },
    offset: 0
};

const threadReducer = (state: IThreadMessagesViewState, action: IThreadAction): IThreadMessagesViewState => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_END':
            return { ...state, end: action.payload };
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'SET_DISPLAYING_THREADS':
            return { ...state, displayingThreads: action.payload };
        case 'SET_SUBSCRIPTION':
            return { ...state, subscription: action.payload };
        case 'SET_FILTER':
            return { ...state, currentFilter: action.payload };
        case 'SET_SEARCH':
            return { ...state, search: action.payload };
        case 'SET_OFFSET':
            return { ...state, offset: action.payload };
        default:
            return state;
    };
};

export {
    threadMessagesInitialState,
    threadReducer
};