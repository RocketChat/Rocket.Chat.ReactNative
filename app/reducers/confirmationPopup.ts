export interface IPopup {
	shouldShowConfirmationPopup: boolean;
	shouldShowRemoveEventPopup: boolean;
	confirmationPopupDetails: any;
	removeEventPopupDetails: any;
}

const initialState: IPopup = {
	shouldShowConfirmationPopup: false,
	shouldShowRemoveEventPopup: false,
	confirmationPopupDetails: null,
	removeEventPopupDetails: null
};

export default function confirmationPopupReducer(state = initialState, action: { type: string; data: any }): any {
	switch (action.type) {
		case 'SHOW_CONFIRMATION_POPUP':
			return {
				...state,
				shouldShowConfirmationPopup: true,
				confirmationPopupDetails: action.data.eventDetails
			};
		case 'HIDE_CONFIRMATION_POPUP':
			return {
				...state,
				shouldShowConfirmationPopup: false
			};
		case 'SHOW_REMOVE_EVENT_POPUP':
			return {
				...state,
				shouldShowRemoveEventPopup: true,
				removeEventPopupDetails: action.data.eventDetails
			};
		case 'HIDE_REMOVE_EVENT_POPUP':
			return {
				...state,
				shouldShowRemoveEventPopup: false
			};
		default:
			return state;
	}
}
