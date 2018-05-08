const random = require('./helpers/random');
const value = random(15);
const data = {
    server: 'open',
    user: `user-${ value }`,
    password: `password-${ value }`,
    email: `diegolmello+${ value }@gmail.com`,
    random: value
}
module.exports = data;