import { ROLES } from '../actions/actionsTypes';
import { type IActionRoles } from '../actions/roles';

export type IRoles = Record<string, string>;

export const initialState: IRoles = {};

export default function roles(state = initialState, action: IActionRoles): IRoles {
	switch (action.type) {
		case ROLES.SET:
			return action.roles;
		case ROLES.UPDATE:
			// oxlint-disable-next-line anti-slop/no-known-value-widening -- IRoles keys are server role ids discovered at runtime
			return {
				...state,
				[action.payload.id]: action.payload.desc || action.payload.id
			};
		case ROLES.REMOVE: {
			const newState = { ...state };
			delete newState[action.payload.id];
			// oxlint-disable-next-line anti-slop/no-known-value-widening -- IRoles keys are server role ids discovered at runtime
			return newState;
		}
		default:
			return state;
	}
}
