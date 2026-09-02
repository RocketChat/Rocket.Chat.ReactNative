let deviceToken = '';

export const getDeviceToken = (): string => deviceToken;

export const setDeviceToken = (token: string): void => {
	deviceToken = token;
};
