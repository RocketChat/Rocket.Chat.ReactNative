import { AppRegistry, AppState, NativeModules } from "react-native";

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
		//runs this every interval
	}

	private static isAppOnBackground(): boolean {
		return !!AppState.currentState.match(BACKGROUND_STATE_REGEX);
	}
}

export default NotificationsBackgroundService;