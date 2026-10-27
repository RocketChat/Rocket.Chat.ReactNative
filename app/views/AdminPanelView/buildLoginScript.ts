const POLL_INTERVAL_MS = 50;
const MAX_ATTEMPTS = 200;

export const buildLoginScript = (token?: string) => `
(function () {
	var attempts = 0;
	function login() {
		if (typeof Meteor !== 'undefined' && Meteor.loginWithToken) {
			Meteor.loginWithToken(${JSON.stringify(token ?? '')}, function () {});
			return;
		}
		attempts += 1;
		if (attempts < ${MAX_ATTEMPTS}) {
			setTimeout(login, ${POLL_INTERVAL_MS});
		}
	}
	login();
})();
true;
`;
