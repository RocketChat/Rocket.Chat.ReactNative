import { VOIP } from '../actions/actionsTypes';
import { TActionVoip } from '../actions/voip';
import { VoipSession, VoipState } from '../lib/voip/definitions';

export interface IVoip {
	state: VoipState;
	session: VoipSession | null;
	registerStatus: 'UNREGISTERED' | 'REGISTERED' | 'REGISTERING' | 'UNREGISTERING';
	remoteStreamUrl: string | undefined;
}

export const initialState: IVoip = {
	registerStatus: 'UNREGISTERED',
	remoteStreamUrl: undefined,
	session: null,
	state: {
		isRegistered: false,
		isReady: false,
		isInCall: false,
		isOnline: false,
		isIncoming: false,
		isOngoing: false,
		isOutgoing: false,
		isError: false
	}
};

export default (state = initialState, action: TActionVoip): IVoip => {
	switch (action.type) {
		case VOIP.UPDATE_SESSION:
			return {
				...state,
				session: action.payload ? { ...state.session, ...action.payload } : null
			};
		case VOIP.UPDATE_STATE:
			return {
				...state,
				state: { ...state.state, ...action.payload }
			};
		case VOIP.UPDATE_REGISTER_STATUS:
			return {
				...state,
				registerStatus: action.payload
			};
		case VOIP.SETUP_REMOTE_MEDIA: {
			return {
				...state,
				remoteStreamUrl: action.payload
			};
		}
		case VOIP.END_CALL: {
			return {
				...state,
				remoteStreamUrl: undefined
			};
		}
		default:
			return state;
	}
};
