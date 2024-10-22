import { TApplicationActions } from '../definitions';
import { EDIT_EVENT, CREATE_EVENT, FETCH_EVENT, PRESS_EVENT } from '../actions/actionsTypes';

interface Peer {
	_id: string;
	createdAt: string;
	name: string;
	emails: string[];
	username: string;
	avatarETag: string;
	customFields: {
		Age: number;
		Bio: string;
		ConnectIds: string;
		'Glucose Monitoring Method': string;
		'Insulin Delivery Method': string;
		Location: string;
		'Stage of Life': string;
		'T1D Since': number;
		VideoUrl: string;
	};
}

interface ICreateEventResult {
	author?: string;
	title?: string;
	description?: string;
	date?: string | Date;
	time?: string;
	meetingLink?: string;
	peers?: Peer[];
	attendees?: string[];
}

export type TCreateEventResult = ICreateEventResult;

export type TCreateEventDraft = {
	author?: string;
};

export interface ICreateEvent {
	isFetching: boolean;
	isDrafting: boolean;
	isEditing: boolean;
	failure: boolean;
	error: any;
	author?: string;
	title?: string;
	description?: string;
	date?: string;
	time?: string;
	meetingLink?: string;
	pressedEvent: {};
	fetchedEvents: ICreateEventResult[];
	peers?: string[];
	numGuests?: number;
}

export const initialState: ICreateEvent = {
	isFetching: false,
	failure: false,
	isDrafting: false,
	isEditing: false,
	pressedEvent: {},
	fetchedEvents: [],
	error: {}
};

export default function (state = initialState, action: TApplicationActions): ICreateEvent {
	switch (action.type) {
		case EDIT_EVENT.REQUEST:
			return {
				...state,
				isFetching: false,
				failure: false,
				error: {},
				isDrafting: false,
				isEditing: true,
				draftEvent: {
					...state.draftEvent,
					...action.data
				}
			};
		case EDIT_EVENT.SUCCESS:
			return {
				...state,
				isFetching: false,
				failure: false,
				error: {},
				isDrafting: false,
				isEditing: false,
				draftEvent: {}
			};
		case EDIT_EVENT.CANCEL:
			return {
				...state,
				isFetching: false,
				failure: false,
				error: {},
				isDrafting: false,
				isEditing: false,
				draftEvent: {}
			};
		case CREATE_EVENT.DRAFT:
			return {
				...state,
				isFetching: false,
				failure: false,
				error: {},
				isDrafting: true,
				draftEvent: {
					...state.draftEvent,
					...action.data
				}
			};
		case CREATE_EVENT.REQUEST:
			return {
				...state,
				isFetching: true,
				isDrafting: false,
				failure: false,
				error: {}
			};
		case CREATE_EVENT.RESET:
			return {
				...state,
				isFetching: false,
				failure: false,
				isDrafting: false,
				isEditing: false,
				createdEvent: action.data,
				draftEvent: {}
			};
		case CREATE_EVENT.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				isDrafting: false,
				createdEvent: action.err
			};
		case FETCH_EVENT.REQUEST:
			return {
				...state,
				isFetching: true,
				failure: false,
				isDrafting: false,
				fetchedEvents: {
					error: {}
				}
			};
		case FETCH_EVENT.SUCCESS:
			return {
				...state,
				isFetching: false,
				failure: false,
				isDrafting: false,
				fetchedEvents: action.data
			};
		case FETCH_EVENT.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				isDrafting: false,
				fetchedEvents: action.err
			};
		case PRESS_EVENT.REQUEST:
			return {
				...state,
				isFetching: false,
				failure: false,
				isDrafting: false,
				pressedEvent: action.data
			};
		case PRESS_EVENT.SUCCESS:
			return {
				...state,
				isFetching: false,
				failure: false
			};
		case PRESS_EVENT.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true
			};
		default:
			return state;
	}
}
