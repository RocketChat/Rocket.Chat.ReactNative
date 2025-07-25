import { TSVDictionary, TSVMessage, TSVStatus } from '../definitions';
import { SUPPORTED_VERSIONS } from '../actions/actionsTypes';
import { TActionSupportedVersions } from '../actions/supportedVersions';

export interface ISupportedVersionsState {
	status: TSVStatus;
	message?: TSVMessage;
	i18n?: TSVDictionary;
	expiration?: string;
}

export const initialState: ISupportedVersionsState = { status: 'supported' };

export default (state = initialState, action: TActionSupportedVersions): ISupportedVersionsState => {
	switch (action.type) {
		case SUPPORTED_VERSIONS.SET:
			return {
				...state,
				status: action.status,
				message: action.message,
				i18n: action.i18n,
				expiration: action.expiration
			};
		default:
			return state;
	}
};
