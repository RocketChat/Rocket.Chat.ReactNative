import { NativeModules } from 'react-native';

const { QuickActionsConnector } = NativeModules;

/**
 * Reads the initial iOS quick action (cold / background launch).
 * Returns the action type once, then clears it on native side.
 */
export async function getRecentQuickAction(): Promise<string | null> {
	console.log(QuickActionsConnector, 'connector=======================');
	if (!QuickActionsConnector?.getInitialQuickAction) {
		return null;
	}

	try {
		const action = await QuickActionsConnector.getInitialQuickAction();
		return action ?? null;
	} catch {
		return null;
	}
}
