import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { KeyboardCommand } = NativeModules;

class KeyboardCommandModule {
	private eventEmitter: NativeEventEmitter | null = null;

	constructor() {
		if (Platform.OS === 'ios' && KeyboardCommand) {
			this.eventEmitter = new NativeEventEmitter(KeyboardCommand);
		}
	}

	addListener(callback: (event: { command: string }) => void) {
		if (!this.eventEmitter) {
			return { remove: () => {} };
		}
		return this.eventEmitter.addListener('onKeyboardCommand', callback);
	}
}

export default new KeyboardCommandModule();
