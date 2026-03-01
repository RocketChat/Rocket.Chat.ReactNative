const isUTF8 = (str: string) => {
	// eslint-disable-next-line no-control-regex
	const regex = /^[\x00-\x7F]*([\xC2-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3})*$/;
	return regex.test(str);
};

const encodeRoleIdForStorage = (id?: string) => {
	if (!id || isUTF8(id)) return id;
	return encodeURIComponent(id);
};

const decodeRoleIdFromStorage = (id: string) => decodeURIComponent(id);

export { decodeRoleIdFromStorage, encodeRoleIdForStorage };
