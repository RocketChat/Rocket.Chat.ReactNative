import {  IBaseScreen, TServerHistoryModel } from '../../definitions';
import { OutsideParamList } from '../../stacks/types';

export interface INewServerViewProps extends IBaseScreen<OutsideParamList, 'NewServerView'> {
	connecting: boolean;
	previousServer: string | null;
};

export interface INewServerViewState {
	text: string;
	connectingOpen: boolean;
	certificate: string | null;
	serversHistory: TServerHistoryModel[];
};

export interface ISubmitParams {
	fromServerHistory?: boolean;
	username?: string;
    serverUrl?: string;
};

export type INewServerAction =
	| { type: 'SET_TEXT'; payload: string }
	| { type: 'SET_CONNECTING_OPEN'; payload: boolean }
	| { type: 'SET_CERTIFICATE'; payload: string | null } 
	| { type: 'SET_SERVERS_HISTORY'; payload: TServerHistoryModel[] }
    | {type: 'DELETE_SERVER_FROM_HISTORY'; payload: string};
	