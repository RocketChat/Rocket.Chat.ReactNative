const random = require('./helpers/random');
const value = 'yyjsojhmmztrqtbjxhti'//random(20);
const data = {
    server: 'http://localhost:3000', // 'https://stable.rocket.chat',
    alternateServer: 'https://stable.rocket.chat',
    user: `user${ value }`,
    password: `password${ value }`,
    alternateUser: 'detoxrn',
    alternateUserPassword: '123',
    email: `detoxrn+${ value }@rocket.chat`,
    random: value
}
module.exports = data;