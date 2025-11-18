// Mock for react-native-mmkv

// Shared storage between instances with the same id
const storageInstances = new Map();

export const Mode = {
	SINGLE_PROCESS: 1,
	MULTI_PROCESS: 2
};

export class MMKV {
	constructor(config = {}) {
		const { id = 'default', mode, path } = config;
		this.id = id;
		this.mode = mode;
		this.path = path;

		// Share storage between instances with the same id
		if (!storageInstances.has(this.id)) {
			storageInstances.set(this.id, {
				storage: new Map(),
				listeners: []
			});
		}

		const instance = storageInstances.get(this.id);
		this.storage = instance.storage;
		this.listeners = instance.listeners;
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
		const deleted = this.storage.delete(key);
		if (deleted) {
			this.notifyListeners(key);
		}
		return deleted;
	}

	getAllKeys() {
		return Array.from(this.storage.keys());
	}

	clearAll() {
		this.storage.clear();
		// Notify about clear (pass undefined to indicate clear all)
		this.notifyListeners(undefined);
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
		this.listeners.forEach((listener) => {
			try {
				listener(key);
			} catch (error) {
				console.error('Error in MMKV listener:', error);
			}
		});
	}
}

// Export Configuration type for TypeScript
export const Configuration = {};
