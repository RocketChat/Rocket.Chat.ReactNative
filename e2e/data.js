const random = require('./helpers/random');
const value = random(15);
const data = {
    server: 'http://localhost:3000',
    user: `user${ value }`,
    password: `password${ value }`,
    email: `diegolmello+${ value }@gmail.com`, // TODO: change email
    random: value
}
module.exports = data;