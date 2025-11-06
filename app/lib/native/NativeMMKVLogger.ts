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
			try {
				this.nativeLogger = NativeModules.MMKVLogger as IMMKVLogger;
			} catch (error) {
				// Native module not available yet - will be available after native build
				console.log('[MMKVLogger] Native logger not available, using console only');
			}
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
			try {
				this.nativeLogger.info(category, formatted);
			} catch (error) {
				// Silent fail - native logger is optional
			}
		}
	}

	error(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.error(`[${category}] ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			try {
				this.nativeLogger.error(category, formatted);
			} catch (error) {
				// Silent fail
			}
		}
	}

	debug(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.debug(`[${category}] ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			try {
				this.nativeLogger.debug(category, formatted);
			} catch (error) {
				// Silent fail
			}
		}
	}

	warning(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.warn(`[${category}] ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			try {
				this.nativeLogger.warning(category, formatted);
			} catch (error) {
				// Silent fail
			}
		}
	}

	fault(category: string, message: string): void {
		const formatted = this.formatMessage(message);
		console.error(`[${category}] FAULT: ${message}`);

		if (this.nativeLogger && Platform.OS === 'ios') {
			try {
				this.nativeLogger.fault(category, formatted);
			} catch (error) {
				// Silent fail
			}
		}
	}

	// Convenience method to log objects
	logObject(category: string, label: string, obj: any): void {
		const message = `${label}: ${JSON.stringify(obj, null, 2)}`;
		this.info(category, message);
	}
}

export default new MMKVLogger();
