// Fast Image can't render a svg image from a uri yet, because of that we aren't test the svg within the RegEx
const regExpUrlImage = new RegExp(
	'.(jpg|jpeg|png|webp|avif|gif)' + // type of the URL
		'(\\?[;&a-z\\d%_.~+=-]*)?' // query string
);
export const isImage = (url: string) => regExpUrlImage.test(url);
