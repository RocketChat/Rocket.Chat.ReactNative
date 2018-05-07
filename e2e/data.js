const random = new Date().getTime();
const data = {
    server: 'open',
    user: `user-${ random }`,
    password: `password-${ random }`,
    email: `diegolmello+${ random }@gmail.com`,

}
module.exports = data;