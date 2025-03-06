export const parseJson = (json: string) => {
	try {
		return JSON.parse(json);
	} catch (ex) {
		return json;
	}
};
