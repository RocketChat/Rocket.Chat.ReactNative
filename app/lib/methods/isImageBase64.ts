export const imageBase64RegExp = new RegExp(/^data:image\/[bmp,gif,ico,jpg,png,svg,webp,x\-icon,svg+xml]+;base64,/);

export function isImageBase64(data?: string): boolean {
	return !!data && imageBase64RegExp.test(data);
}
