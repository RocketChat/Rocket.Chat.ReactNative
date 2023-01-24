import { ENCRYPTION } from '../actions/actionsTypes';
import { TApplicationActions } from '../definitions';

export type IBanner = string;
export interface IEncryption {
	enabled: boolean;
	banner: IBanner;
}

export const initialState: IEncryption = {
	enabled: false,
	banner: ''
};

export default function encryption(state = initialState, action: TApplicationActions): IEncryption {
	switch (action.type) {
		case ENCRYPTION.SET:
			return {
				...state,
				enabled: action.enabled,
				banner: action.banner
			};
		case ENCRYPTION.SET_BANNER:
			return {
				...state,
				banner: action.banner
			};
		case ENCRYPTION.INIT:
			return initialState;
		default:
			return state;
	}
}
