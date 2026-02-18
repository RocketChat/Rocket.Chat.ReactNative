// Mock for react-native-mmkv v4
const { useState, useEffect, useRef, useMemo, useCallback } = require('react');

// Shared storage between instances with the same id
const storageInstances = new Map();
let defaultInstance = null;

export const Mode = {
	SINGLE_PROCESS: 'single-process',
	MULTI_PROCESS: 'multi-process'
};

// MMKV Instance class
class MMKVInstance {
	constructor(config = {}) {
		const { id = 'mmkv.default', path, encryptionKey, mode, readOnly } = config;
		this.id = id;
		this.path = path;
		this.encryptionKey = encryptionKey;
		this.mode = mode;
		this.isReadOnly = readOnly || false;
		this._size = 0;

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

	get size() {
		return this._size;
	}

	set(key, value) {
		if (this.isReadOnly) {
			throw new Error('Cannot set value in read-only instance');
		}
		this.storage.set(key, value);
		this._size = this.storage.size;
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

	getBuffer(key) {
		const value = this.storage.get(key);
		return value instanceof ArrayBuffer ? value : undefined;
	}

	contains(key) {
		return this.storage.has(key);
	}

	remove(key) {
		if (this.isReadOnly) {
			throw new Error('Cannot remove value in read-only instance');
		}
		const deleted = this.storage.delete(key);
		if (deleted) {
			this._size = this.storage.size;
			this.notifyListeners(key);
		}
		return deleted;
	}

	getAllKeys() {
		return Array.from(this.storage.keys());
	}

	clearAll() {
		if (this.isReadOnly) {
			throw new Error('Cannot clear read-only instance');
		}
		this.storage.clear();
		this._size = 0;
		// Notify about clear (pass undefined to indicate clear all)
		this.notifyListeners(undefined);
	}

	recrypt(key) {
		this.encryptionKey = key;
	}

	trim() {
		// No-op for mock
	}

	importAllFrom(other) {
		let count = 0;
		for (const [key, value] of other.storage.entries()) {
			this.storage.set(key, value);
			count++;
		}
		this._size = this.storage.size;
		return count;
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

// Factory function to create MMKV instances
export function createMMKV(configuration) {
	return new MMKVInstance(configuration);
}

// Get default instance
function getDefaultMMKVInstance() {
	if (defaultInstance == null) {
		defaultInstance = createMMKV();
	}
	return defaultInstance;
}

// Top-level functions
export function existsMMKV(id) {
	return storageInstances.has(id);
}

export function deleteMMKV(id) {
	return storageInstances.delete(id);
}

// Helper function for configuration comparison
function isConfigurationEqual(left, right) {
	if (left == null || right == null) {
		return left == null && right == null;
	}

	return (
		left.encryptionKey === right.encryptionKey && left.id === right.id && left.path === right.path && left.mode === right.mode
	);
}

/**
 * Use the default, shared MMKV instance or a custom instance with configuration
 */
export function useMMKV(configuration) {
	return useMemo(() => {
		if (configuration == null) {
			return getDefaultMMKVInstance();
		}
		return createMMKV(configuration);
	}, [configuration]);
}

/**
 * Listen for changes in the given MMKV storage instance
 */
export function useMMKVListener(valueChangedListener, instance) {
	const ref = useRef(valueChangedListener);
	const mmkv = instance ?? getDefaultMMKVInstance();

	useEffect(() => {
		ref.current = valueChangedListener;
	}, [valueChangedListener]);

	useEffect(() => {
		const listener = mmkv.addOnValueChangedListener((changedKey) => {
			ref.current(changedKey);
		});
		return () => listener.remove();
	}, [mmkv]);
}

/**
 * Get a list of all keys that exist in the given MMKV instance
 */
export function useMMKVKeys(instance) {
	const mmkv = instance ?? getDefaultMMKVInstance();
	const [allKeys, setKeys] = useState(() => mmkv.getAllKeys());

	useMMKVListener((key) => {
		const currentlyHasKey = allKeys.includes(key);
		const hasKey = mmkv.contains(key);
		if (hasKey !== currentlyHasKey) {
			setKeys(() => mmkv.getAllKeys());
		}
	}, mmkv);

	return allKeys;
}

/**
 * Create a custom MMKV hook for a specific type
 */
function createMMKVHook(getter) {
	return (key, instance) => {
		const mmkv = instance ?? getDefaultMMKVInstance();

		const [bump, setBump] = useState(0);
		const value = useMemo(() => {
			bump;
			return getter(mmkv, key);
		}, [mmkv, key, bump]);

		const set = useCallback(
			(v) => {
				const newValue = typeof v === 'function' ? v(getter(mmkv, key)) : v;
				switch (typeof newValue) {
					case 'number':
					case 'string':
					case 'boolean':
						mmkv.set(key, newValue);
						break;
					case 'undefined':
						mmkv.remove(key);
						break;
					case 'object':
						if (newValue instanceof ArrayBuffer) {
							mmkv.set(key, newValue);
							break;
						} else {
							throw new Error(`MMKV: Type object (${newValue}) is not supported!`);
						}
					default:
						throw new Error(`MMKV: Type ${typeof newValue} is not supported!`);
				}
			},
			[key, mmkv]
		);

		useEffect(() => {
			const listener = mmkv.addOnValueChangedListener((changedKey) => {
				if (changedKey === key) {
					setBump(b => b + 1);
				}
			});
			return () => listener.remove();
		}, [key, mmkv]);

		return [value, set];
	};
}

/**
 * Use the string value of the given key from the given MMKV storage instance
 */
export const useMMKVString = createMMKVHook((instance, key) => instance.getString(key));

/**
 * Use the number value of the given key from the given MMKV storage instance
 */
export const useMMKVNumber = createMMKVHook((instance, key) => instance.getNumber(key));

/**
 * Use the boolean value of the given key from the given MMKV storage instance
 */
export const useMMKVBoolean = createMMKVHook((instance, key) => instance.getBoolean(key));

/**
 * Use the object value (JSON stringified) of the given key from the given MMKV storage instance
 */
export const useMMKVObject = createMMKVHook((instance, key) => {
	const stored = instance.getString(key);
	return stored ? JSON.parse(stored) : undefined;
});

/**
 * Use the buffer value of the given key from the given MMKV storage instance
 */
export const useMMKVBuffer = createMMKVHook((instance, key) => instance.getBuffer(key));
