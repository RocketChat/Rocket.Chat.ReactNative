export const getServerTimeSync = async (server: string) => {
	try {
		const response = await Promise.race([fetch(`${server}/_timesync`), new Promise<undefined>(res => setTimeout(res, 2000))]);
		const data = await response?.json();
		if (data) return parseInt(data);
		return null;
	} catch {
		return null;
	}
};
