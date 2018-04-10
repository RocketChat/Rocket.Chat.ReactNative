export const get = function(url) {
	const { token, userId, server } = this;
	return fetch(`${ server }/api/v1/${ url }`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Auth-Token': token,
			'X-User-Id': userId
		}
	}).then(response => response.json());
};
