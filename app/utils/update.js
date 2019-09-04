import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

const update = (db, table, object) => {
	const collections = db.collections.get(table);
	const actions = [
		db.action(async() => {
			try {
				const obj = await collections.find(object.id);
				await obj.update((record) => {
					record._raw = sanitizedRaw({ ...object }, collections.schema);
				});
			} catch (error) {
				await collections.create((record) => {
					record._raw = sanitizedRaw({ ...object }, collections.schema);
				});
			}
		})
	];
	return Promise.all(actions);
};

export default update;
