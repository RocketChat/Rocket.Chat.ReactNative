export default class Realm {
	schema = [];

	data = [];

	constructor(params) {
		require('lodash').each(params.schema, (schema) => {
			this.data[schema.name] = [];
			this.data[schema.name].filtered = () => this.data[schema.name];
		});
		this.schema = params.schema;
	}

	objects(schemaName) {
		return this.data[schemaName];
	}

	write = (fn) => {
		fn();
	}

	create(schemaName, data) {
		this.data[schemaName].push(data);
		return data;
	}
}
