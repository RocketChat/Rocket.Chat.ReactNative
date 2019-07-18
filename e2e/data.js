const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'https://ilarion.rocket.chat',
    alternateServer: 'https://stable.rocket.chat',
    user: `user${ value }`,
    password: `password${ value }`,
    alternateUser: 'detoxrn',
    alternateUserPassword: '123',
    alternateUserTOTPSecret: 'NFXHKKC6FJXESL25HBYTYNSFKR4WCTSXFRKUUVKEOBBC6I3JKI7A',
    existingEmail: 'hilarion.galushka@gmail.com',
    existingName: 'ilarion.halushka',
    email: `hilarion.galushkae2e${ value }@gmail.com`,
    random: value
}
module.exports = data;
