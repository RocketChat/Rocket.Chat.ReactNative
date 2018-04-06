import toQuery from './toQuery';

export const get = function({
	token, id, server
}, method, params = {}) {
	return fetch(`${ server }/api/v1/${ method }?${ toQuery(params) }`, {
		method: 'get',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': token,
			'X-User-Id': id
		}
	}).then(response => response.json());
};


export const post = function({
	token, id, server
}, method, params = {}) {
	return fetch(`${ server }/api/v1/${ method }`, {
		method: 'post',
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json',
			// Accept: 'application/json',
			'X-Auth-Token': token,
			'X-User-Id': id
		}
	}).then(response => response.json(), alert).then((msg) => {
		if (msg.success !== undefined && !msg.success) {
			return Promise.reject(msg);
		}
		return msg;
	});
};
