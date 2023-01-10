// Fast Image can't render a svg image from a uri yet, because of that we aren't test the svg within the RegEx
export const regExpUrlImage = new RegExp(
	'.(jpg|jpeg|png|webp|avif|gif|tiff)' + // type of the URL
		'(\\?[;&a-z\\d%_.~+=-]*)?',
	'i' // query string
);
export const isImage = (url: string) => regExpUrlImage.test(url);
