const imageBase64RegExp = new RegExp(/^data:image\/[bmp,gif,ico,jpg,png,svg,webp,x\-icon,svg+xml]+;base64,/);
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

// I don't know if we should test this function, because the regex will pass through all the data on the base64
// "maybe", depending the length of the data, will waste to much time
// https://github.com/wix/react-native-ui-lib/blob/cf700e0d65caa0a0b601fe1edbd763ad4e6748a4/src/utils/imageUtils.ts#L14-L18
export function isImageBase64ImageContent(data: string): boolean {
	const imageBase64Content = data.split(',')[1];
	const imageBase64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
	return imageBase64regex.test(imageBase64Content);
}
