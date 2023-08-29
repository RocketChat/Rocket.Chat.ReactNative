import { VIDEO_CONF } from '../actions/actionsTypes';
import { TActionVideoConf } from '../actions/videoConf';

export type TSupportedCallStatus = 'call' | 'canceled' | 'accepted' | 'rejected' | 'confirmed' | 'join' | 'end' | 'calling';

export interface ICallInfo {
	callId: string;
	rid: string;
	uid: string;
	action?: TSupportedCallStatus;
}

export interface IVideoConf {
	calls: ICallInfo[];
	calling: boolean;
}

export const initialState: IVideoConf = { calls: [], calling: false };

export default (state = initialState, action: TActionVideoConf): IVideoConf => {
	switch (action.type) {
		case VIDEO_CONF.SET:
			return {
				...state,
				calls: [...state.calls, action.payload]
			};
		case VIDEO_CONF.REMOVE:
			return {
				...state,
				calls: state.calls.filter(call => call.callId !== action.payload.callId)
			};
		case VIDEO_CONF.CLEAR:
			return initialState;
		case VIDEO_CONF.SET_CALLING:
			return { ...state, calling: action.payload };
		default:
			return state;
	}
};
