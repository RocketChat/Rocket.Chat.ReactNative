/**
 * Facade re-implementations of appSchema/tableSchema/sanitizedRaw.
 *
 * Consumes the existing WMDB-shaped schema/app.js and schema/servers.js definitions.
 * sanitizedRaw MUST NOT emit _status/_changed — Drizzle has no such columns.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ColumnSchema {
	name: string;
	type: 'string' | 'boolean' | 'number';
	isOptional?: boolean;
	isIndexed?: boolean;
}

export interface TableSchema {
	name: string;
	columns: ColumnSchema[];
	columnArray: ColumnSchema[];
	/** Keyed by column name for O(1) lookup */
	columnsByName: Record<string, ColumnSchema>;
}

export interface AppSchema {
	version: number;
	tables: Record<string, TableSchema>;
}

export type RawRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

export function tableSchema(input: { name: string; columns: ColumnSchema[] }): TableSchema {
	const columnArray = input.columns;
	const columnsByName: Record<string, ColumnSchema> = {};
	for (const col of columnArray) {
		columnsByName[col.name] = col;
	}
	return { name: input.name, columns: columnArray, columnArray, columnsByName };
}

export function appSchema(input: { version: number; tables: TableSchema[] }): AppSchema {
	const tables: Record<string, TableSchema> = {};
	for (const t of input.tables) {
		tables[t.name] = t;
	}
	return { version: input.version, tables };
}

// ---------------------------------------------------------------------------
// Random ID — WMDB style: lowercase alphanumeric, 16 chars
// ---------------------------------------------------------------------------

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomId(): string {
	let id = '';
	for (let i = 0; i < 16; i++) {
		id += CHARS[Math.floor(Math.random() * CHARS.length)];
	}
	return id;
}

// ---------------------------------------------------------------------------
// _setRaw coercion — matches WMDB RawRecord/index.js verbatim
// ---------------------------------------------------------------------------

function isValidNumber(value: unknown): value is number {
	return typeof value === 'number' && !Number.isNaN(value) && value !== Infinity && value !== -Infinity;
}

export function setRawCoerced(raw: RawRecord, key: string, value: unknown, col: ColumnSchema): void {
	const { type, isOptional } = col;
	if (type === 'string') {
		if (typeof value === 'string') {
			raw[key] = value;
		} else {
			raw[key] = isOptional ? null : '';
		}
	} else if (type === 'boolean') {
		if (typeof value === 'boolean') {
			raw[key] = value;
		} else if (value === 1 || value === 0) {
			raw[key] = Boolean(value);
		} else {
			raw[key] = isOptional ? null : false;
		}
	} else if (isValidNumber(value)) {
		// number column, valid value
		raw[key] = value;
	} else {
		// number column, invalid value → default
		raw[key] = isOptional ? null : 0;
	}
}

// ---------------------------------------------------------------------------
// sanitizedRaw
// ---------------------------------------------------------------------------

/**
 * Coerces dirtyRaw into a Drizzle-insertable record.
 * Deliberately omits _status/_changed (no such Drizzle columns).
 * Generates a random id when dirtyRaw.id is not a string.
 */
export function sanitizedRaw(dirtyRaw: Record<string, unknown>, schema: TableSchema): RawRecord {
	const raw: RawRecord = {};

	raw.id = typeof dirtyRaw.id === 'string' ? dirtyRaw.id : randomId();

	const columns = schema.columnArray;
	for (let i = 0, len = columns.length; i < len; i++) {
		const col = columns[i];
		const key = col.name;
		const value = Object.prototype.hasOwnProperty.call(dirtyRaw, key) ? dirtyRaw[key] : null;
		setRawCoerced(raw, key, value, col);
	}

	return raw;
}
