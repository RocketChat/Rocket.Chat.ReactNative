import { VIDEO_CONF } from '../actions/actionsTypes';
import { TActionVideoConf } from '../actions/videoConf';

export type TSupportedCallStatus = 'call' | 'canceled' | 'accepted' | 'rejected' | 'confirmed' | 'join' | 'end';

export interface ICallInfo {
	callId: string;
	rid: string;
	uid: string;
	type: TSupportedCallStatus;
}

interface ICallInfoRecord {
	[key: string]: ICallInfo;
}

export const initialState: ICallInfoRecord = {};

export default (state = initialState, action: TActionVideoConf): ICallInfoRecord => {
	switch (action.type) {
		case VIDEO_CONF.SET:
			return {
				...state,
				[action.payload.callId]: action.payload
			};
		case VIDEO_CONF.REMOVE:
			return Object.fromEntries(Object.entries(state).filter(([key]) => key !== action.payload.callId));
		case VIDEO_CONF.CLEAR:
			return initialState;
		default:
			return state;
	}
};
