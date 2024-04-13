/* eslint-disable no-undef */
const sleep = (time) => {
	const t = new Date().getTime() + time;
	while (new Date().getTime() <= t) {
		// do nothing
	}
};

output.helpers_sleep = sleep;
