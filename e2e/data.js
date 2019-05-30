const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'https://ilarion.rocket.chat',
    alternateServer: 'https://stable.rocket.chat',
    user: `user${ value }`,
    password: `password${ value }`,
    alternateUser: 'detoxrn',
    alternateUserPassword: '123',
    alternateUserTOTPSecret: 'KZJX2WT2JEZF4VJUGFCHGNR2OBVWC2DVFAUUAXJ2MUXFURCSHERQ',
    email: `hilarion.galushka+e2e${ value }@rocket.chat`,
    random: value
}
module.exports = data;
