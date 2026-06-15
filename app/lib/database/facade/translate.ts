/**
 * Lowers Q clause descriptors to Drizzle SQL expressions.
 * Operates against a Drizzle table's column map (Record<string, Column>).
 */

import { and, or, eq, ne, gt, gte, lt, lte, like, inArray, not, isNull, isNotNull, asc, desc, type SQL } from 'drizzle-orm';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { getTableColumns } from 'drizzle-orm';

import type * as Q from './Q';

export interface TranslatedQuery {
	where: SQL | undefined;
	orderBy: SQL[];
	limit: number | undefined;
	offset: number | undefined;
}

type ColumnMap = ReturnType<typeof getTableColumns>;
type Column = ColumnMap[string];

function resolveColumn(columns: ColumnMap, name: string): Column {
	const col = columns[name];
	if (!col) throw new Error(`Column '${name}' not found in table`);
	return col;
}

function translateComparison(col: Column, comparison: Q.Comparison): SQL | undefined {
	const { operator, value, values } = comparison;
	switch (operator) {
		// SQL `= NULL` / `<> NULL` are never true; WMDB lowers null comparisons to IS [NOT] NULL.
		case 'eq':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return value === null ? isNull(col) : eq(col, value as any);
		case 'notEq':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return value === null ? isNotNull(col) : ne(col, value as any);
		case 'gt':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return gt(col, value as any);
		case 'gte':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return gte(col, value as any);
		case 'lt':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return lt(col, value as any);
		case 'lte':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return lte(col, value as any);
		case 'like':
			return like(col, value as string);
		case 'notLike':
			return not(like(col, value as string));
		case 'oneOf':
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return inArray(col, values as any[]);
	}
}

function translateWhere(clause: Q.Clause, columns: ColumnMap): SQL | undefined {
	switch (clause.type) {
		case 'where':
			return translateComparison(resolveColumn(columns, clause.column), clause.comparison);
		case 'and': {
			const conditions = clause.clauses.map(c => translateWhere(c, columns)).filter(Boolean);
			return and(...(conditions as SQL[])) ?? undefined;
		}
		case 'or': {
			const conditions = clause.clauses.map(c => translateWhere(c, columns)).filter(Boolean);
			return or(...(conditions as SQL[])) ?? undefined;
		}
		// sortBy/take/skip are not where clauses; they are handled in translateClauses
		case 'sortBy':
		case 'take':
		case 'skip':
			return undefined;
		case 'on':
			// Q.on is db-module only. Returning undefined here means it won't filter — callers
			// that use Q.on must build the correlated subquery themselves before calling translate.
			return undefined;
	}
}

/** Translates a clause list into a structured query descriptor for Drizzle. */
export function translateClauses(clauses: Q.Clause[], table: SQLiteTable): TranslatedQuery {
	const columns = getTableColumns(table);
	const whereParts: (SQL | undefined)[] = [];
	const orderBy: SQL[] = [];
	let limit: number | undefined;
	let offset: number | undefined;

	for (const clause of clauses) {
		if (clause.type === 'sortBy') {
			const col = resolveColumn(columns, clause.column);
			orderBy.push(clause.direction === 'desc' ? desc(col) : asc(col));
		} else if (clause.type === 'take') {
			limit = clause.count;
		} else if (clause.type === 'skip') {
			offset = clause.count;
		} else {
			const w = translateWhere(clause, columns);
			if (w) whereParts.push(w);
		}
	}

	const where = whereParts.length > 0 ? and(...(whereParts as SQL[])) : undefined;

	return { where, orderBy, limit, offset };
}
