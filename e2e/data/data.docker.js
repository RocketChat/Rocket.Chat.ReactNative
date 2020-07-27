const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'http://127.0.0.1:3000',
    adminUser: 'admin',
    adminPassword: 'password',
    alternateServer: 'https://stable.rocket.chat',
    users: {
        regular: {
            username: `userone${ value }`,
            password: '123',
            email: `mobile+regular${ value }@rocket.chat`
        },
        alternate: {
            username: `usertwo${ value }`,
            password: '123',
            email: `mobile+alternate${ value }@rocket.chat`,
            totpSecret: 'NA4GOMZGHBQSK6KEFRVT62DMGJJGSYZJFZIHO3ZOGVXWCYZ6MMZQ'
        },
        profileChanges: {
            username: `userthree${ value }`,
            password: '123',
            email: `mobile+profileChanges${ value }@rocket.chat`
        },
        existing: {
            username: `existinguser${ value }`,
            password: '123',
            email: `mobile+existing${ value }@rocket.chat`
        }
    },
    channels: {
        detoxpublic: {
            name: 'detox-public'
        }
    },
    groups: {
        private: {
            name: `detox-private-${ value }`
        }
    },
    registeringUser: {
        username: `newuser${ value }`,
        password: `password${ value }`,
        email: `mobile+registering${ value }@rocket.chat`
    },
    random: value
}
module.exports = data;
