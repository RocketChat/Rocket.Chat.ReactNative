import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

const update = (db, table, object) => {
	const collections = db.collections.get(table);
	const actions = [
		db.action(async() => {
			try {
				const obj = await collections.find(object.id);
				await obj.update((record) => {
					record._raw = sanitizedRaw({ id: object.id, ...record._raw }, collections.schema);
					delete object.id;
					Object.assign(record, object);
				});
			} catch (error) {
				await collections.create((record) => {
					record._raw = sanitizedRaw({ id: object.id }, collections.schema);
					delete object.id;
					Object.assign(record, object);
				});
			}
		})
	];
	return Promise.all(actions);
};

export default update;
