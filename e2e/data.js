const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'http://localhost:3000',
    alternateServer: 'https://stable.rocket.chat',
    user: `user${ value }`,
    password: `password${ value }`,
    alternateUser: 'detoxrn',
    alternateUserPassword: '123',
    alternateUserTOTPSecret: 'KESVIUCQMZWEYNBMJJAUW4LYKRBVWYZ7HBWTIWDPIAZUOURTF4WA',
    email: `diego.mello+e2e${ value }@rocket.chat`,
    random: value
}
module.exports = data;