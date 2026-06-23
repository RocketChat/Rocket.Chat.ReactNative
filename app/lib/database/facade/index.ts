/**
 * Public surface of the facade.
 *
 * Re-exports consumed by the ~80 call sites that currently import from @nozbe/watermelondb.
 * After cutover (NATIVE-1282) the WMDB package is removed; imports point here instead.
 */

// Core types — Model is exported as a value: model classes inside the db module do `extends Model`.
export { Model } from './Model';
export { Database } from './Database';
export type { Collection } from './Collection';
export type { Query } from './Query';
export { Relation } from './decorators';

// Q namespace
export * as Q from './Q';
// Also export individual Q types for `type Q.WhereDescription` etc.
export type { WhereDescription, SortBy, Clause, Skip, Take, Or } from './Q';

// sanitizedRaw + schema builders
export { sanitizedRaw, appSchema, tableSchema } from './schema';
export type { TableSchema, AppSchema, ColumnSchema, RawRecord } from './schema';

// Decorators
export { field, date, json, readonly, children, relation } from './decorators';
