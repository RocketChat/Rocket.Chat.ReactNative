import toQuery from './toQuery';


const handleSuccess = (msg) => {
	if (msg.success !== undefined && !msg.success) {
		return Promise.reject(msg);
	}
	return msg;
};

export const get = function({
	token, id, server
}, method, params = {}) {
	return fetch(`${ server }/api/v1/${ method }/?${ toQuery(params) }`, {
		method: 'get',
		headers: {
			// 'Accept-Encoding': 'gzip',
			'Content-Type': 'application/json',
			'X-Auth-Token': token,
			'X-User-Id': id
		}
	}).then(response => response.json()).then(handleSuccess);
};


export const post = function({
	token, id, server
}, method, params = {}) {
	return fetch(`${ server }/api/v1/${ method }`, {
		method: 'post',
		body: JSON.stringify(params),
		headers: {
			// 'Accept-Encoding': 'gzip',
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'X-Auth-Token': token,
			'X-User-Id': id
		}
	}).then(response => response.json()).then(handleSuccess);
};
