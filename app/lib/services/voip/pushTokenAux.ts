// TODO: find a better place for this
let voipPushToken: string | null = null;

export const getVoipPushToken = (): string | null => voipPushToken;

export const setVoipPushToken = (token: string): void => {
	voipPushToken = token;
};
