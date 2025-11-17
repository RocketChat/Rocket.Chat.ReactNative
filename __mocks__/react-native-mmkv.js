// Mock for react-native-mmkv

export const Mode = {
	SINGLE_PROCESS: 1,
	MULTI_PROCESS: 2
};

export class MMKV {
	constructor(config) {
		this.id = config?.id || 'default';
		this.storage = new Map();
		this.listeners = [];
	}

	set(key, value) {
		this.storage.set(key, value);
		this.notifyListeners(key);
	}

	getString(key) {
		const value = this.storage.get(key);
		return typeof value === 'string' ? value : undefined;
	}

	getNumber(key) {
		const value = this.storage.get(key);
		return typeof value === 'number' ? value : undefined;
	}

	getBoolean(key) {
		const value = this.storage.get(key);
		return typeof value === 'boolean' ? value : undefined;
	}

	contains(key) {
		return this.storage.has(key);
	}

	delete(key) {
		this.storage.delete(key);
		this.notifyListeners(key);
	}

	getAllKeys() {
		return Array.from(this.storage.keys());
	}

	clearAll() {
		this.storage.clear();
	}

	addOnValueChangedListener(callback) {
		this.listeners.push(callback);
		return {
			remove: () => {
				const index = this.listeners.indexOf(callback);
				if (index > -1) {
					this.listeners.splice(index, 1);
				}
			}
		};
	}

	notifyListeners(key) {
		this.listeners.forEach(listener => listener(key));
	}
}
