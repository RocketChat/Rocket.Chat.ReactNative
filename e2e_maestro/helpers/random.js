/* eslint-disable no-undef */
const random = (length = 10) => {
	let text = '';
	const possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	for (let i = 0; i < length; i += 1) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

output.helpers_random = random;
