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
            password: '123'
        },
        alternate: {
            username: `usertwo${ value }`,
            password: '123',
            totpSecret: 'NA4GOMZGHBQSK6KEFRVT62DMGJJGSYZJFZIHO3ZOGVXWCYZ6MMZQ'
        },
        profileChanges: {
            username: `userthree${ value }`,
            password: '123',  
        },
        existing: {
            username: `existinguser${ value }`,
            password: '123'
        }
    },
    channels: {
        public: {
            name: 'detox-public'
        }
    },
    registeringUser: {
        username: `newuser${ value }`,
        password: `password${ value }`
    },
    random: value
}
module.exports = data;
