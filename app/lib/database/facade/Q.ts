/**
 * Q namespace — clause descriptor objects only.
 * No eager Drizzle refs; safe to import without a DB handle.
 */

// ---------------------------------------------------------------------------
// Clause descriptor types
// ---------------------------------------------------------------------------

export interface WhereDescription {
	type: 'where';
	column: string;
	value: unknown;
}

export interface NotEqDescription {
	type: 'notEq';
	column: string;
	value: unknown;
}

export interface GtDescription {
	type: 'gt';
	column: string;
	value: number;
}

export interface GteDescription {
	type: 'gte';
	column: string;
	value: number;
}

export interface LtDescription {
	type: 'lt';
	column: string;
	value: number;
}

export interface LteDescription {
	type: 'lte';
	column: string;
	value: number;
}

export interface LikeDescription {
	type: 'like';
	column: string;
	value: string;
}

export interface NotLikeDescription {
	type: 'notLike';
	column: string;
	value: string;
}

export interface OneOfDescription {
	type: 'oneOf';
	column: string;
	values: unknown[];
}

export interface AndDescription {
	type: 'and';
	clauses: Clause[];
}

export interface OrDescription {
	type: 'or';
	clauses: Clause[];
}

export interface SortBy {
	type: 'sortBy';
	column: string;
	direction: 'asc' | 'desc';
}

export interface Take {
	type: 'take';
	count: number;
}

export interface Skip {
	type: 'skip';
	count: number;
}

export interface OnDescription {
	type: 'on';
	table: string;
	clause: Clause;
}

export type Clause =
	| WhereDescription
	| NotEqDescription
	| GtDescription
	| GteDescription
	| LtDescription
	| LteDescription
	| LikeDescription
	| NotLikeDescription
	| OneOfDescription
	| AndDescription
	| OrDescription
	| SortBy
	| Take
	| Skip
	| OnDescription;

// Type aliases re-exported to match WMDB surface
export type Or = OrDescription;

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

export function where(column: string, value: unknown): WhereDescription {
	return { type: 'where', column, value };
}

export function notEq(column: string, value: unknown): NotEqDescription {
	return { type: 'notEq', column, value };
}

export function gt(column: string, value: number): GtDescription {
	return { type: 'gt', column, value };
}

export function gte(column: string, value: number): GteDescription {
	return { type: 'gte', column, value };
}

export function lt(column: string, value: number): LtDescription {
	return { type: 'lt', column, value };
}

export function lte(column: string, value: number): LteDescription {
	return { type: 'lte', column, value };
}

export function like(column: string, value: string): LikeDescription {
	return { type: 'like', column, value };
}

export function notLike(column: string, value: string): NotLikeDescription {
	return { type: 'notLike', column, value };
}

export function oneOf(column: string, values: unknown[]): OneOfDescription {
	return { type: 'oneOf', column, values };
}

export function and(...clauses: Clause[]): AndDescription {
	return { type: 'and', clauses };
}

export function or(...clauses: Clause[]): OrDescription {
	return { type: 'or', clauses };
}

export function sortBy(column: string, direction: 'asc' | 'desc' = 'asc'): SortBy {
	return { type: 'sortBy', column, direction };
}

export function asc(column: string): SortBy {
	return { type: 'sortBy', column, direction: 'asc' };
}

export function desc(column: string): SortBy {
	return { type: 'sortBy', column, direction: 'desc' };
}

export function take(count: number): Take {
	return { type: 'take', count };
}

export function skip(count: number): Skip {
	return { type: 'skip', count };
}

/** Used inside the db module only — correlated EXISTS subquery at translate time. */
export function on(table: string, clause: Clause): OnDescription {
	return { type: 'on', table, clause };
}
