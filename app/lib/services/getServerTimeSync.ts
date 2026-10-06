import fetch from '../methods/helpers/fetch';
import { getBasicAuthHeader } from '../methods/getBasicAuthHeader';

export const getServerTimeSync = async (server: string) => {
	try {
		const response = await Promise.race([
			fetch(`${server}/_timesync`, { headers: { Authorization: getBasicAuthHeader(server) } }),
			new Promise<undefined>(res => setTimeout(res, 2000))
		]);
		const data = await response?.json();
		if (data) return parseInt(data);
		return null;
	} catch {
		return null;
	}
};
