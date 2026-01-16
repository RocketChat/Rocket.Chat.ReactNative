function random(length = 10) {
	let text = '';
	const possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	for (let i = 0; i < length; i += 1) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function generatePassword(length = 10) {
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nums = '0123456789'
    const all = lower + upper + nums

    let password = ''
    password += lower[Math.floor(Math.random() * lower.length)]
    password += upper[Math.floor(Math.random() * upper.length)]
    password += nums[Math.floor(Math.random() * nums.length)]

    while (password.length < length) {
        const char = all[Math.floor(Math.random() * all.length)]
        const last = password[password.length - 1]
        const secondLast = password[password.length - 2]
        const thirdLast = password[password.length - 3]

        if (char === last && char === secondLast && char === thirdLast) continue
        password += char
    }

    return password
}


const randomUser = () => {
    const randomVal = random();
    return {
        username: 'user' + randomVal,
        name: 'user' + randomVal,
        password: generatePassword(),
        email: 'mobile+' + randomVal + '@rocket.chat'
    };
}

const randomTeamName = () => {
    const randomVal = random();

    return 'team' + randomVal;
}

output.random = random;
output.randomUser = randomUser;
output.randomTeamName = randomTeamName;