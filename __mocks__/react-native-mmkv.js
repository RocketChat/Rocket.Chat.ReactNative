// Keep in sync with app/lib/methods/userPreferences.ts.
const { useState, useEffect, useCallback } = require('react');

// Shared storage between instances with the same id
const storageInstances = new Map();

class MMKVInstance {
	constructor(config = {}) {
		const { id = 'mmkv.default', path, encryptionKey, mode } = config;
		this.id = id;
		this.path = path;
		this.encryptionKey = encryptionKey;
		this.mode = mode;

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

	remove(key) {
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

export function createMMKV(configuration) {
	return new MMKVInstance(configuration);
}

export function useMMKVString(key, instance) {
	const [value, setValue] = useState(() => instance.getString(key));

	const set = useCallback(
		v => {
			const newValue = typeof v === 'function' ? v(instance.getString(key)) : v;
			if (newValue === undefined) {
				instance.remove(key);
				return;
			}
			if (typeof newValue !== 'string') {
				throw new Error(`MMKV: Type ${typeof newValue} is not supported!`);
			}
			instance.set(key, newValue);
		},
		[key, instance]
	);

	useEffect(() => {
		setValue(instance.getString(key));
		const listener = instance.addOnValueChangedListener(changedKey => {
			if (changedKey === undefined || changedKey === key) {
				setValue(instance.getString(key));
			}
		});
		return () => listener.remove();
	}, [key, instance]);

	return [value, set];
}
