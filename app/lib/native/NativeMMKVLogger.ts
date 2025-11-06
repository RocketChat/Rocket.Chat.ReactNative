import { NativeModules, Platform } from 'react-native';

interface IMMKVLogger {
	info(category: string, message: string): void;
	error(category: string, message: string): void;
	debug(category: string, message: string): void;
	warning(category: string, message: string): void;
	fault(category: string, message: string): void;
}

// Wrapper to log to os_log on iOS (for TestFlight) and console everywhere else
class MMKVLogger {
	private nativeLogger: IMMKVLogger | null = null;

	constructor() {
		if (Platform.OS === 'ios') {
			this.nativeLogger = NativeModules.MMKVLogger as IMMKVLogger;
		}
	}

	// Format message with timestamp for better tracking
	private formatMessage(message: string): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] ${message}`;
	}

	info(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.log(`[${category}] ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			this.nativeLogger.info(category, formatted);
		}
	}

	error(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.error(`[${category}] ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			this.nativeLogger.error(category, formatted);
		}
	}

	debug(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.debug(`[${category}] ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			this.nativeLogger.debug(category, formatted);
		}
	}

	warning(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.warn(`[${category}] ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			this.nativeLogger.warning(category, formatted);
		}
	}

	fault(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.error(`[${category}] FAULT: ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			this.nativeLogger.fault(category, formatted);
		}
	}

	// Convenience method to log objects
	logObject(category: string, label: string, obj: any): void {
		const message = `${label}: ${JSON.stringify(obj, null, 2)}`;
		this.info(category, message);
	}
}

export default new MMKVLogger();

