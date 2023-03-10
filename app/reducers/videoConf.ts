import { VIDEO_CONF } from '../actions/actionsTypes';
import { TActionVideoConf } from '../actions/videoConf';

export type TSupportedCallStatus = 'call' | 'canceled' | 'accepted' | 'rejected' | 'confirmed' | 'join' | 'end';

export interface ICallInfo {
	callId: string;
	rid: string;
	uid: string;
	action?: TSupportedCallStatus;
}

interface ICallInfoRecord {
	[key: string]: ICallInfo;
}

export interface IVideoConf {
	calls: ICallInfoRecord;
	calling: boolean;
}

export const initialState: IVideoConf = { calls: {}, calling: false };

export default (state = initialState, action: TActionVideoConf): IVideoConf => {
	switch (action.type) {
		case VIDEO_CONF.SET:
			return {
				...state,
				calls: { ...state.calls, [action.payload.callId]: action.payload }
			};
		case VIDEO_CONF.REMOVE:
			return {
				...state,
				calls: Object.fromEntries(Object.entries(state).filter(([key]) => key !== action.payload.callId))
			};
		case VIDEO_CONF.CLEAR:
			return initialState;
		case VIDEO_CONF.SET_CALLING:
			return { ...state, calling: action.payload };
		default:
			return state;
	}
};
