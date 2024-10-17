import { TSupportedThemes } from '../../theme';
import {  IBaseScreen, TServerHistoryModel } from '../../definitions';
import { OutsideParamList } from '../../stacks/types';

export interface INewServerViewProps extends IBaseScreen<OutsideParamList, 'NewServerView'> {
	connecting: boolean;
	previousServer: string | null;
};

export type TNewServerViewState = {
	text: string;
	connectingOpen: boolean;
	certificate: string | null;
	serversHistory: TServerHistoryModel[];
};

export type TSubmitParams  = {
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
	

export type TCertificatePicker = {
	previousServer: string | null;
	certificate: string | null;
	theme: TSupportedThemes;
	handleRemove: () => void;
	chooseCertificate: () => Promise<void>;
};
