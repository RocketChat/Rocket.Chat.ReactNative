// Mock for react-native-mmkv
const { useState, useEffect } = require('react');

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
		this.listeners.forEach(listener => {
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

// React hooks for MMKV
export function useMMKVString(key, mmkvInstance) {
	const [value, setValue] = useState(() => mmkvInstance.getString(key));

	useEffect(() => {
		const listener = mmkvInstance.addOnValueChangedListener(changedKey => {
			if (changedKey === key || changedKey === undefined) {
				setValue(mmkvInstance.getString(key));
			}
		});
		return () => listener.remove();
	}, [key, mmkvInstance]);

	const setStoredValue = newValue => {
		if (newValue === undefined) {
			mmkvInstance.delete(key);
		} else {
			mmkvInstance.set(key, newValue);
		}
		setValue(newValue);
	};

	return [value, setStoredValue];
}

export function useMMKVNumber(key, mmkvInstance) {
	const [value, setValue] = useState(() => mmkvInstance.getNumber(key));

	useEffect(() => {
		const listener = mmkvInstance.addOnValueChangedListener(changedKey => {
			if (changedKey === key || changedKey === undefined) {
				setValue(mmkvInstance.getNumber(key));
			}
		});
		return () => listener.remove();
	}, [key, mmkvInstance]);

	const setStoredValue = newValue => {
		if (newValue === undefined) {
			mmkvInstance.delete(key);
		} else {
			mmkvInstance.set(key, newValue);
		}
		setValue(newValue);
	};

	return [value, setStoredValue];
}

export function useMMKVBoolean(key, mmkvInstance) {
	const [value, setValue] = useState(() => mmkvInstance.getBoolean(key));

	useEffect(() => {
		const listener = mmkvInstance.addOnValueChangedListener(changedKey => {
			if (changedKey === key || changedKey === undefined) {
				setValue(mmkvInstance.getBoolean(key));
			}
		});
		return () => listener.remove();
	}, [key, mmkvInstance]);

	const setStoredValue = newValue => {
		if (newValue === undefined) {
			mmkvInstance.delete(key);
		} else {
			mmkvInstance.set(key, newValue);
		}
		setValue(newValue);
	};

	return [value, setStoredValue];
}

export function useMMKVObject(key, mmkvInstance) {
	const [value, setValue] = useState(() => {
		const stored = mmkvInstance.getString(key);
		return stored ? JSON.parse(stored) : undefined;
	});

	useEffect(() => {
		const listener = mmkvInstance.addOnValueChangedListener(changedKey => {
			if (changedKey === key || changedKey === undefined) {
				const stored = mmkvInstance.getString(key);
				setValue(stored ? JSON.parse(stored) : undefined);
			}
		});
		return () => listener.remove();
	}, [key, mmkvInstance]);

	const setStoredValue = newValue => {
		if (newValue === undefined) {
			mmkvInstance.delete(key);
		} else {
			mmkvInstance.set(key, JSON.stringify(newValue));
		}
		setValue(newValue);
	};

	return [value, setStoredValue];
}
