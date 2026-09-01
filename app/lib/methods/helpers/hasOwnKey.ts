export const hasOwnKey = <T extends object>(obj: T, key: string): key is keyof T & string =>
	Object.prototype.hasOwnProperty.call(obj, key);
