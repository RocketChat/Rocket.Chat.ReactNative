import RNFetchBlob from 'rn-fetch-blob';

export const getServerTimeSync = async (server: string) => {
	try {
		const response = await Promise.race([
			RNFetchBlob.fetch('GET', `${server}/_timesync`),
			new Promise<undefined>(res => setTimeout(res, 2000))
		]);
		if (response?.data) {
			return parseInt(response.data);
		}
		return null;
	} catch {
		return null;
	}
};
