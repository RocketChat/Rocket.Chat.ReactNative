import { CUSTOM_USER_STATUS } from '../actions/actionsTypes';
import { type ICustomUserStatus, type TApplicationActions } from '../definitions';

export const initialState: ICustomUserStatus[] = [];

export default (state = initialState, action: TApplicationActions): ICustomUserStatus[] => {
	switch (action.type) {
		case CUSTOM_USER_STATUS.SET:
			return action.customUserStatus;
		default:
			return state;
	}
};
