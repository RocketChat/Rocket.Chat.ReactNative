/**
 * Q namespace — clause descriptor objects only.
 * No eager Drizzle refs; safe to import without a DB handle.
 *
 * Mirrors WatermelonDB's surface: comparison operators (eq, gt, like, …) take ONLY the
 * right-hand value and return a Comparison; Q.where(column, valueOrComparison) wraps it
 * (a raw value is treated as an implicit eq). Operators are never clauses on their own.
 */

// ---------------------------------------------------------------------------
// Comparison — right-hand side of a where clause
// ---------------------------------------------------------------------------

export type Operator = 'eq' | 'notEq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'notLike' | 'oneOf';

export interface Comparison {
	__comparison: true;
	operator: Operator;
	value?: unknown;
	values?: unknown[];
}

function isComparison(value: unknown): value is Comparison {
	return typeof value === 'object' && value !== null && (value as Comparison).__comparison === true;
}

// ---------------------------------------------------------------------------
// Clause descriptor types
// ---------------------------------------------------------------------------

export interface WhereDescription {
	type: 'where';
	column: string;
	comparison: Comparison;
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

export type Clause = WhereDescription | AndDescription | OrDescription | SortBy | Take | Skip | OnDescription;

// Type alias re-exported to match WMDB surface
export type Or = OrDescription;

// ---------------------------------------------------------------------------
// Comparison operators — take only the right-hand value
// ---------------------------------------------------------------------------

export function eq(value: unknown): Comparison {
	return { __comparison: true, operator: 'eq', value };
}

export function notEq(value: unknown): Comparison {
	return { __comparison: true, operator: 'notEq', value };
}

export function gt(value: unknown): Comparison {
	return { __comparison: true, operator: 'gt', value };
}

export function gte(value: unknown): Comparison {
	return { __comparison: true, operator: 'gte', value };
}

export function lt(value: unknown): Comparison {
	return { __comparison: true, operator: 'lt', value };
}

export function lte(value: unknown): Comparison {
	return { __comparison: true, operator: 'lte', value };
}

export function like(value: string): Comparison {
	return { __comparison: true, operator: 'like', value };
}

export function notLike(value: string): Comparison {
	return { __comparison: true, operator: 'notLike', value };
}

export function oneOf(values: unknown[]): Comparison {
	return { __comparison: true, operator: 'oneOf', values };
}

// ---------------------------------------------------------------------------
// Clause builders
// ---------------------------------------------------------------------------

/** A raw value is treated as an implicit eq; a Comparison is used as-is. */
export function where(column: string, valueOrComparison: unknown): WhereDescription {
	const comparison = isComparison(valueOrComparison) ? valueOrComparison : eq(valueOrComparison);
	return { type: 'where', column, comparison };
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
