export const imageBase64RegExp = new RegExp(/^data:image\/[bmp,gif,ico,jpg,png,svg,webp,x\-icon,svg+xml]+;base64,/);
const regExpOf120Characters = new RegExp(/^data:image\/[bmp,gif,ico,jpg,png,svg,webp,x\-icon,svg+xml]+;base64,([\w+\/=]{1,120})/);
const mimeTypeBase64RegExp = new RegExp(/^data:(.+);base64,/);

export function isImageBase64(data: string): boolean {
	return !!data && imageBase64RegExp.test(data);
}

export function valueOfFirst120CharactersOfImageBase64(imageBase64: string): string | undefined {
	const result = imageBase64.match(regExpOf120Characters)?.[0];
	if (result) {
		return result.replace(imageBase64RegExp, '');
	}
}

export function getBase64MimeType(data: string): string | undefined {
	const mimeType = data.match(mimeTypeBase64RegExp);
	if (mimeType) {
		return mimeType[1];
	}
}
