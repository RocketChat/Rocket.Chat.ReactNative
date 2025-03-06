// Use checkUseSsl: false only if server url starts with http://
export const isSsl = (url: string): boolean => !/http:\/\//.test(url);
