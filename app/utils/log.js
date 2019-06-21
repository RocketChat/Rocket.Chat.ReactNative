import { bugsnag } from '../lib/bugsnag';

export default (event, error) => {
	if (__DEV__) {
		console.warn(event, error);
	} else {
		bugsnag.notify(error);
	}
};
