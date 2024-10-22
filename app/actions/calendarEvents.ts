import { Action } from 'redux';

import { TCreateEventResult } from '../reducers/calendarEvent';
import {
	CREATE_EVENT,
	DELETE_EVENT,
	EDIT_EVENT,
	FETCH_EVENT,
	PRESS_EVENT,
	REGISTER_EVENT,
	DE_REGISTER_EVENT,
	UPDATE_EVENT
} from './actionsTypes';

interface ICreateEventRequest extends Action {
	data: TCreateEventResult;
}

interface ICreateEventSuccess extends Action {
	data: TCreateEventResult;
}

interface ICreateEventFailure extends Action {
	err: any;
}

export type TActionCreateEvent = ICreateEventRequest & ICreateEventSuccess & ICreateEventFailure;

export function editEvent(data: TCreateEventResult): ICreateEventRequest {
	return {
		type: EDIT_EVENT.REQUEST,
		data
	};
}

export function cancelEventEdit() {
	return {
		type: EDIT_EVENT.CANCEL
	};
}

export function updateEventRequest() {
	return {
		type: UPDATE_EVENT.REQUEST
	};
}

export function updateEventSuccess() {
	return {
		type: UPDATE_EVENT.SUCCESS
	};
}

export function deleteEventRequest(eventId: string) {
	return {
		type: DELETE_EVENT.REQUEST,
		data: eventId
	};
}

export function deleteEventSuccess() {
	return {
		type: DELETE_EVENT.SUCCESS
	};
}

export function createEventDraft(data: TCreateEventResult): ICreateEventRequest {
	return {
		type: CREATE_EVENT.DRAFT,
		data
	};
}

export function createEventRequest() {
	return {
		type: CREATE_EVENT.REQUEST
	};
}

export function createEventSuccess(data: TCreateEventResult): ICreateEventSuccess {
	return {
		type: CREATE_EVENT.SUCCESS,
		data
	};
}

export function createEventReset() {
	return {
		type: CREATE_EVENT.RESET
	};
}

export function createEventFailure(err: any): ICreateEventFailure {
	return {
		type: CREATE_EVENT.FAILURE,
		err
	};
}

export function fetchEventRequest() {
	return {
		type: FETCH_EVENT.REQUEST
	};
}

export function fetchEventSuccess(data: any) {
	return {
		type: FETCH_EVENT.SUCCESS,
		data
	};
}

export function fetchEventFailure(err: any) {
	return {
		type: FETCH_EVENT.FAILURE,
		err
	};
}

export function pressEventRequest(data: any) {
	return {
		type: PRESS_EVENT.REQUEST,
		data
	};
}

export function pressEventSuccess(data: any) {
	return {
		type: PRESS_EVENT.SUCCESS,
		data
	};
}

export function pressEventFailure(err: any) {
	return {
		type: PRESS_EVENT.FAILURE,
		err
	};
}

export function registerEventRequest(eventId: string, attendeeId: string) {
	return {
		type: REGISTER_EVENT.REQUEST,
		data: {
			eventId,
			attendeeId
		}
	};
}

export function registerEventSuccess() {
	return {
		type: REGISTER_EVENT.SUCCESS
	};
}

export function deregisterEventRequest(eventId: string, attendeeId: string) {
	return {
		type: DE_REGISTER_EVENT.REQUEST,
		data: {
			eventId,
			attendeeId
		}
	};
}

export function deregisterEventSuccess() {
	return {
		type: DE_REGISTER_EVENT.SUCCESS
	};
}
