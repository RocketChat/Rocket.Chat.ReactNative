const TEAM_TYPE = {
	PUBLIC: 0,
	PRIVATE: 1
};

let headers = {}
const { data } = output;

const login = (username, password) => {
	const response = http.post(`${data.server}/api/v1/login`, {
        headers: {
            'Content-Type': 'application/json'
        },
		body: JSON.stringify({
			user: username,
			password
		})
	});

	const { authToken, userId } = json(response.body)?.data

	headers = { 'X-User-Id': userId, 'X-Auth-Token': authToken }
    console.log('headers', JSON.stringify(headers))
	return { authToken, userId }
};

const randomUser = () => {
    const randomVal = output.random();
    return {
        username: 'user' + randomVal,
        name: 'user' + randomVal,
        password: 'Password1@' + randomVal,
        email: 'mobile+' + randomVal + '@rocket.chat'
    };
}

const createUser = () => {
    login(output.account.adminUser, output.account.adminPassword);

    const user = randomUser();
    
    console.log(JSON.stringify({
        username: user.username,
        name: user.name,
        password: user.password,
        email: user.email,
        ...(customProps || {})
    }))
    const response = http.post(`${data.server}/api/v1/users.create`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({
            username: user.username,
            name: user.name,
            password: user.password,
            email: user.email,
            ...(customProps || {})
        })
    });

    data.accounts.push({
        username: user.username,
        password: user.password
    })
    // console.log(`Created ${user.username} / ${user.password}`);
    // console.log(JSON.stringify(json(response.body)));
}

function random(length) {
	length = length || 10;
	var text = '';
	var possible = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

const deleteCreatedUser = async ({ username: usernameToDelete }) => {
	try {
		login(output.account.adminUser, output.account.adminPassword);
		const result = http.get(`${data.server}/api/v1/users.info?username=${usernameToDelete}`, {
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });
        
        const userId = json(result.body)?.data?.user?._id;
		http.post(`${data.server}/api/v1/users.delete`, { userId, confirmRelinquish: true }, {
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        });
	} catch (error) {
		console.log(JSON.stringify(error));
	}
};

// Delete created users to avoid use all the Seats Available on the server
const deleteCreatedUsers = () => {
	if (data.accounts.length) {
		for (const deleteUser of data.accounts) {
			deleteCreatedUser(deleteUser);
		}
	}
};

function logAccounts() {
    console.log(JSON.stringify(data.accounts));
}

output.utils = {
    createUser,
    logAccounts,
    deleteCreatedUsers
};