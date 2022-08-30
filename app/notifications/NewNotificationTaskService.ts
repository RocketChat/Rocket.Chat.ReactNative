// import store from "../store";
// import PushNotificationsService, {
// 	PushParams
// } from "./PushNotificationsService";
// import { PlannedOperation } from "../common/models/Operation";
import HttpRequests from "../utils/HttpRequests";
import { errorLogRequest } from "../store/logger/actions";
// import { addNewOperations } from "../store/operations/Actions";
// import { OperationTypeCodeToValue } from "../common/models/codeToValueMapping";
// import { NEW_OPERATIONS_NOTIFICATION_ID } from "../utils/config/NotificationsIds";
// import { getVillageHebrewValue } from "../utils/utils";
// import { HTTPError } from "../utils/config/HTTPError";
// import { OperationStatus } from "../common/enum/OperationStatus";

class NewNotificationTaskService {
	public static async checkNewNotificationsTask(): Promise<void> {
        console.log('hey from down under')
		// try {
		// 	if (
		// 		!NewOperationsTaskService.isLoggedIn ||
        //         NewOperationsTaskService.isDuringOperation
		// 	)
		// 		return;
        //
		// 	const { operations } = store.getState().OperationsReducer;
		// 	const url = `/operation/latest/${NewOperationsTaskService.getOperationIdsQueryParam(
		// 		operations
		// 	)}`;
        //
		// 	const newOperations: PlannedOperation[] = await HttpRequests.get(url);
        //
		// 	if (newOperations.length && NewOperationsTaskService.isLoggedIn) {
		// 		NewOperationsTaskService.handleNewOperations(newOperations);
		// 	}
		// } catch (e) {
		// 	const isHttpError = e instanceof HTTPError;
		// 	const isIncompatibleVersion =
        //         e.status === HTTPError.INCOMPATIBLE_VERSION_STATUS;
        //
		// 	if (isIncompatibleVersion || (isHttpError && !e.status)) {
		// 		return;
		// 	}
        //
		// 	store.dispatch(errorLogRequest(e));
		// }
	}

	// private static handleNewOperations(newOperations: PlannedOperation[]): void {
	// 	store.dispatch(addNewOperations(newOperations));
    //
	// 	const notificationText = NewOperationsTaskService.getNotificationText(
	// 		newOperations
	// 	);
    //
	// 	PushNotificationsService.push({
	// 		id: NEW_OPERATIONS_NOTIFICATION_ID,
	// 		tag: "NewOperation",
	// 		...notificationText
	// 	});
	// }

	// private static get isLoggedIn(): boolean {
	// 	return !!store.getState().LoginReducer.user;
	// }

	// private static get isDuringOperation(): boolean {
	// 	return (
	// 		store.getState().OperationReducer.operation?.status ===
    //         OperationStatus.ON_PROGRESS
	// 	);
	// }

	// private static getNotificationText(
	// 	newOperations: PlannedOperation[]
	// ): Pick<PushParams, "message" | "title"> {
	// 	return newOperations.length === 1
	// 		? {
	// 			title: "הופצה אליך פעילות חדשה באקילה",
	// 			message: `פעילות ${OperationTypeCodeToValue.get(
	// 				newOperations[0].type
	// 			)} ב${getVillageHebrewValue(newOperations[0].location.villageId)}`
	// 		}
	// 		: {
	// 			title: ` הופצו אליך ${newOperations.length} פעילויות חדשות באקילה`,
	// 			message: `${[
	// 				...new Set(
	// 					newOperations.map((operation) => operation.location.villageId)
	// 				)
	// 			].reduce(
	// 				(string, village, index) =>
	// 					`${string +
    //                     (index ? ", " : "")
	// 					}ב${
	// 						getVillageHebrewValue(village)}`,
	// 				"פעילויות "
	// 			)}`
	// 		};
	// }
	// private static getOperationIdsQueryParam(
	// 	operations: PlannedOperation[]
	// ): string {
	// 	return operations.reduce(
	// 		(string, operation, index) =>
	// 			`${string}${index ? "&" : "?"}excludedIds=${operation._id}`,
	// 		""
	// 	);
	// }
}

export default NewNotificationTaskService;
