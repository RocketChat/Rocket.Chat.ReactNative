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
            email: `diego.mello+regular${ value }@rocket.chat`
        },
        alternate: {
            username: `usertwo${ value }`,
            password: '123',
            email: `diego.mello+alternate${ value }@rocket.chat`,
            totpSecret: 'NA4GOMZGHBQSK6KEFRVT62DMGJJGSYZJFZIHO3ZOGVXWCYZ6MMZQ'
        },
        profileChanges: {
            username: `userthree${ value }`,
            password: '123',
            email: `diego.mello+profileChanges${ value }@rocket.chat`
        },
        existing: {
            username: `existinguser${ value }`,
            password: '123',
            email: `diego.mello+existing${ value }@rocket.chat`
        }
    },
    channels: {
        public: {
            name: 'detox-public'
        }
    },
    registeringUser: {
        username: `newuser${ value }`,
        password: `password${ value }`,
        email: `diego.mello+registering${ value }@rocket.chat`
    },
    random: value
}
module.exports = data;
