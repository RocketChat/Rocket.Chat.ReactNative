function random(length = 10) {
	let text = '';
	const possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	for (let i = 0; i < length; i += 1) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

const randomUser = () => {
    const randomVal = random();
    return {
        username: 'user' + randomVal,
        name: 'user' + randomVal,
        password: 'Password1@' + randomVal,
        email: 'mobile+' + randomVal + '@rocket.chat'
    };
}
output.random = random;
output.randomUser = randomUser;