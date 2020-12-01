const axios = require('axios').default;
const data = require('../data');

let server = data.server

const rocketchat = axios.create({
    baseURL: `${server}/api/v1/`,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
    }
})

const login = async (username, password) => {
    console.log(`Logging in as user ${username}`)
    const response = await rocketchat.post('login', {
        "user": username,
        "password": password
    })
    const userId = response.data.data.userId
    const authToken = response.data.data.authToken
    rocketchat.defaults.headers.common['X-User-Id'] = userId
    rocketchat.defaults.headers.common['X-Auth-Token'] = authToken
}

const createUser = async (username, password, name, email) => {
    console.log(`Creating user ${username}`)
    try {
        await rocketchat.post('users.create', {
            "username": username,
            "password": password,
            "name": name,
            "email": email
        })
    } catch (error) {
        console.log(JSON.stringify(error))
        throw "Failed to create user"
    }
}

const createChannelIfNotExists = async (channelname) => {
    console.log(`Creating public channel ${channelname}`)
    try {
        const room = await rocketchat.post('channels.create', {
            "name": channelname
        })
        return room
    } catch (createError) {
        try { //Maybe it exists already?
            const room = rocketchat.get(`channels.info?roomName=${channelname}`)
            return room
        } catch (infoError) {
            console.log(JSON.stringify(createError))
            console.log(JSON.stringify(infoError))
            throw "Failed to find or create public channel"
        }
    }
}

const createGroupIfNotExists = async (groupname) => {
    console.log(`Creating private group ${groupname}`)
    try {
        await rocketchat.post('groups.create', {
            "name": groupname
        })
    } catch (createError) {
        try { //Maybe it exists already?
            await rocketchat.get(`groups.info?roomName=${groupname}`)
        } catch (infoError) {
            console.log(JSON.stringify(createError))
            console.log(JSON.stringify(infoError))
            throw "Failed to find or create private group"
        }
    }
}

const changeChannelJoinCode = async (roomId, joinCode) => {
    console.log(`Changing channel Join Code ${roomId}`)
    try {
        await rocketchat.post('method.call/saveRoomSettings', {
            message: JSON.stringify({
                method: 'saveRoomSettings',
                params: [
                    roomId,
                    { joinCode }
                ]
            })
        })
    } catch (createError) {
        console.log(JSON.stringify(createError))
        throw "Failed to create protected channel"
    }
}

const sendMessage = async (user, groupname, msg) => {
    console.log(`Sending message to ${groupname}`)
    try {
        await login(user.username, user.password);
        await rocketchat.post('chat.postMessage', { channel: `#${groupname}`, msg });
    } catch (infoError) {
        console.log(JSON.stringify(createError))
        console.log(JSON.stringify(infoError))
        throw "Failed to find or create private group"
    }
}

const setup = async () => {
    await login(data.adminUser, data.adminPassword)
    
    for (var userKey in data.users) {
        if (data.users.hasOwnProperty(userKey)) {
            const user = data.users[userKey]
            await createUser(user.username, user.password, user.username, user.email)
        }
    }

    for (var channelKey in data.channels) {
        if (data.channels.hasOwnProperty(channelKey)) {
            const channel = data.channels[channelKey]
            const { data: { channel: { _id } } } = await createChannelIfNotExists(channel.name)

            if (channel.joinCode) {
                await changeChannelJoinCode(_id, channel.joinCode);
            }
        }
    }

    await login(data.users.regular.username, data.users.regular.password)

    for (var groupKey in data.groups) {
        if (data.groups.hasOwnProperty(groupKey)) {
            const group = data.groups[groupKey]
            await createGroupIfNotExists(group.name)
        }
    }

    return
}

module.exports = {
    setup, sendMessage
}