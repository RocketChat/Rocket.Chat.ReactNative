import { type Collection, type Model, type Query } from '@nozbe/watermelondb';

// WatermelonDB has no public synchronous read. With the JSI SQLite adapter these private
// methods invoke the callback before returning; any other adapter leaves the result empty.

export const findRecordSync = <T extends Model>(collection: Collection<T>, id: string): T | undefined => {
	const cachedRecord = collection._cache.get(id);
	if (cachedRecord) {
		return cachedRecord;
	}
	let record: T | undefined;
	collection.database.adapter.underlyingAdapter.find(collection.table, id, result => {
		if ('value' in result && result.value) {
			record = collection._cache.recordFromQueryResult(result.value);
		}
	});
	return record;
};

export const fetchQuerySync = <T extends Model>(query: Query<T>): T[] => {
	let records: T[] = [];
	query.collection._fetchQuery(query, result => {
		if ('value' in result) {
			records = result.value;
		}
	});
	return records;
};
