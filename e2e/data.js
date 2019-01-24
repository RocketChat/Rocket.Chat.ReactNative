const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'http://localhost:3000',
    alternateServer: 'https://unstable.rocket.chat',
    user: `user${ value }`,
    password: `password${ value }`,
    alternateUser: 'detox',
    alternateUserPassword: '123',
    alternateUserTOTPSecret: 'KFJW6SZMH5EUI5LHPJ2XCOKKGRHDA2ZDN5YD4YLBMMSSMVCEPJSQ',
    email: `diego.mello+e2e${ value }@rocket.chat`,
    random: value
}
module.exports = data;