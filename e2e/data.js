const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'https://stable.rocket.chat',
    alternateServer: 'https://unstable.rocket.chat',
    user: `user${ value }`,
    password: `password${ value }`,
    alternateUser: 'detoxrn',
    alternateUserPassword: '123',
    email: `detoxrn+${ value }@rocket.chat`,
    random: value
}
module.exports = data;