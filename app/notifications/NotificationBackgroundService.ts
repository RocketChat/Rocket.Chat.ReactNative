import { AppRegistry, AppState, NativeModules } from "react-native";
import { offlineActionCreators } from "react-native-offline";
import NewNotificationTaskService from "./NewNotificationTaskService";

// import store from "../store";
// import IdleOperationTaskService from "./IdleOperationTaskService";
// import NewOperationsTaskService from "./NewOperationsTaskService";

const BACKGROUND_STATE_REGEX = /inactive|background/;

class NotificationsBackgroundService {
	private static readonly HEADLESS_TASK_APP_KEY = "Notifications";

	public static init(): void {
		console.log('background service init')
		AppRegistry.registerHeadlessTask(
			NotificationsBackgroundService.HEADLESS_TASK_APP_KEY,
			() => NotificationsBackgroundService.backgroundTasks
		);
	}

	public static startService(): void {
		NativeModules.Notifications.startService();
	}

	public static stopService(): void {
		NativeModules.Notifications.stopService();
	}

	private static async backgroundTasks(): Promise<void> {
		console.log('executed background tasks')
		if (NotificationsBackgroundService.isAppOnBackground()) {
			// IdleOperationTaskService.handleIdleOperationTask();
			// OperationsBackgroundService.handleOfflineQueue();
		}

		NewNotificationTaskService.checkNewNotificationsTask();
	}

	private static handleOfflineQueue(): void {
		// const { actionQueue, isConnected } = store.getState().network;
		// if (actionQueue.length && isConnected) {
		// 	const { connectionChange } = offlineActionCreators;
		// 	connectionChange(isConnected);
		// }
	}

	private static isAppOnBackground(): boolean {
		return !!AppState.currentState.match(BACKGROUND_STATE_REGEX);
	}
}

export default NotificationsBackgroundService;