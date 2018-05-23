function random(length) {
	let text = '';
	const possible = 'abcdefghijklmnopqrstuvwxyz';
	for (let i = 0; i < length; i += 1) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
module.exports = random;