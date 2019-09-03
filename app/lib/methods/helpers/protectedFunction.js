import log from '../../../utils/log';

export default fn => (...params) => {
	try {
		fn(...params);
	} catch (e) {
		log(e);
	}
};
