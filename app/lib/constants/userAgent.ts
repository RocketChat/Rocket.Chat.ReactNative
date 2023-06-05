import { isIOS } from '../methods/helpers';

export const userAgent = isIOS
	? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1'
	: 'Mozilla/5.0 (Linux; Android 12; SM-A315G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Mobile Safari/537.36';
