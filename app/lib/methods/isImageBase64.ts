export const imageBase64RegExp = new RegExp(/^data:image\/([a-zA-Z]*);base64,([^\"]*)$/);

export function isImageBase64(data?: string): boolean {
	return imageBase64RegExp.test(data);
}
