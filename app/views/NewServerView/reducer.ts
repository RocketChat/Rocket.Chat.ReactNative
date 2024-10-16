import { INewServerAction, TNewServerViewState } from "./types";

const newServerInitialState: TNewServerViewState = {
    text: '',
    connectingOpen: false,
    certificate: null,
    serversHistory: []
};

const newServerReducer = (state: TNewServerViewState, action: INewServerAction): TNewServerViewState => {
    switch (action.type) {
        case 'SET_TEXT':
            return { ...state, text: action.payload };
        case 'SET_CONNECTING_OPEN':
            return { ...state, connectingOpen: action.payload };
        case 'SET_CERTIFICATE':
            return { ...state, certificate: action.payload };
        case 'SET_SERVERS_HISTORY':
            return { ...state, serversHistory: action.payload };
        case 'DELETE_SERVER_FROM_HISTORY':
            return {...state,  serversHistory: state.serversHistory.filter(server => server.id !== action.payload)}
        default:
            return state;
    };
};

export {
    newServerInitialState,
    newServerReducer
};