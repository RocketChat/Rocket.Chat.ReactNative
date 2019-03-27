const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'http://localhost:3000',
    alternateServer: 'https://stable.rocket.chat',
    user: `user${ value }`,
    password: `password${ value }`,
    alternateUser: 'detoxrn',
    alternateUserPassword: '123',
    alternateUserTOTPSecret: 'I5SGETK3GBXXA7LNLMZTEJJRIN3G6LTEEE4G4PS3EQRXU4LNPU7A',
    email: `diego.mello+e2e${ value }@rocket.chat`,
    random: value
}
module.exports = data;