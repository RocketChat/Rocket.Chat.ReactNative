import { isImage } from './image';

const imageJPG = 't2mul61342l91.jpg';
const imagePNG = '205175493-fc1f7fdd-d10a-4099-88c4-146bac69e223.png';
const imageSVG = 't2mul61342l91.svg';
const linkToImagePNG = 'https://user-images.githubusercontent.com/47038980/205175493-fc1f7fdd-d10a-4099-88c4-146bac69e223.png';
const linkToImageWithQueryParams =
	'https://i.ytimg.com/vi/suFuJZCfC7g/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARhlIGUoZTAP&rs=AOn4CLB_0OCFNuoCRBlaTJEa2PPOOHxkbQ';

describe("Evaluate if the string is returning an image's type", () => {
	test('return true when the image ends with .jpg', () => {
		const result = isImage(imageJPG);
		expect(result).toBe(true);
	});
	test('return true when the image ends with .png', () => {
		const result = isImage(imagePNG);
		expect(result).toBe(true);
	});
	test('return false when the image ends with .svg', () => {
		const result = isImage(imageSVG);
		expect(result).toBe(false);
	});
	test('return true when the image ends with .jpg and query params', () => {
		const result = isImage(linkToImageWithQueryParams);
		expect(result).toBe(true);
	});
	test('return true when a link ends with .png', () => {
		const result = isImage(linkToImagePNG);
		expect(result).toBe(true);
	});
});
