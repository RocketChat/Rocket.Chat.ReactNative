const TEAM_TYPE = {
    PUBLIC: 0,
    PRIVATE: 1
};

let headers = {}
const { data } = output;

const DEEPLINK_METHODS = { AUTH: 'auth', ROOM: 'room' };

const amp = '&';

const getDeepLink = (method, server, ...params) => {
    let deeplink = `rocketchat://${method}?host=${server.replace(/^(http:\/\/|https:\/\/)/, '')}`;

    if (params.length > 0) {
        deeplink += `&${params.join('')}`;
    }

    return deeplink;
};


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

    const { authToken, userId } = json(response.body)?.data;

    headers = { 'X-User-Id': userId, 'X-Auth-Token': authToken }

    return { authToken, userId }
};

const createUser = (customProps) => {
    const user = output.randomUser();

    login(output.account.adminUser, output.account.adminPassword);

    const api = http.post(`${data.server}/api/v1/users.create`, {
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
    console.log(api.body); 

    data.accounts.push({
        username: user.username,
        password: user.password
    });

    return user;
}

const createUserWithPasswordChange = () => {
    return createUser({ requirePasswordChange: true });
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

const createRandomTeam = (username, password) => {
    login(username, password);

    const teamName = output.randomTeamName();

    http.post(`${data.server}/api/v1/teams.create`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({ "name": teamName, "members": [], "type": 1, "room": { "readOnly": false, "extraData": { "topic": "", "broadcast": false, "encrypted": false } } })
    });

    return teamName;
}

const createRandomRoom = (username, password, type = 'c') => {
    login(username, password);
    const room = `room${output.random()}`;

    const response = http.post(`${data.server}/api/v1/${type === 'c' ? 'channels.create' : 'groups.create'}`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({ name: room })
    });

    const result = json(response.body);

    return {
        _id: type === 'c' ? result.channel._id : result.group._id,
        name: type === 'c' ? result.channel.name : result.group.name
    };
};

const sendMessage = (username, password, channel, msg, tmid) => {
    login(username, password);
    const channelParam = tmid ? { roomId: channel } : { channel };

    const response = http.post(`${data.server}/api/v1/chat.postMessage`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({
            ...channelParam,
            text: msg,
            tmid
        })
    });

    const result = json(response.body);

    return result;
};

const getProfileInfo = (userId) => {
    login(output.account.adminUser, output.account.adminPassword);
    
    const result = http.get(`${data.server}/api/v1/users.info?userId=${userId}`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });

    const resultJson = json(result.body);

    return resultJson?.user;
};

const post = (endpoint, username, password, body) => {
    login(username, password);

    const response = http.post(`${data.server}/api/v1/${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify(body)
    });

    return response;
};

const createDM = (username, password, otherUsername) => {
    login(username, password);

    const result = http.post(`${data.server}/api/v1/im.create`, {
        headers: {
            'Content-Type': 'application/json',
            ...headers
        },
        body: JSON.stringify({
            username: otherUsername
        })
    });

    console.log(JSON.stringify(json(result.body), null, 2));
    return json(result.body);
}

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
    createUserWithPasswordChange,
    logAccounts,
    deleteCreatedUsers,
    createRandomTeam,
    createRandomRoom,
    sendMessage,
    getProfileInfo,
    post,
    login,
    getDeepLink,
    createDM
};