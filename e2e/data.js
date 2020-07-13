const random = require('./helpers/random');
const value = random(20);
const data = {
    server: 'http://127.0.0.1:3000',
    alternateServer: 'https://stable.rocket.chat',
    user: 'detoxrn2',
    password: '123',
    alternateUser: 'detoxrn',
    alternateUserPassword: '123',
    alternateUserTOTPSecret: 'NA4GOMZGHBQSK6KEFRVT62DMGJJGSYZJFZIHO3ZOGVXWCYZ6MMZQ',
    registeringUser: `user${ value }`,
    registeringPassword: `password${ value }`,
    registeringEmail: `e2e.test.user+${ value }@example.com`,
    profileChangeUser: 'detoxrnProfileChanges',
    profileChangeUserPassword: '123',
    existingEmail: 'YOUR.SECOND@EMAIL.COM',
    existingName: 'YOUR.NAME',
    random: value
}
module.exports = data;
