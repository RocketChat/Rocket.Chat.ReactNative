import { isImage } from './image';

const imageJPG = 'https://i.redd.it/t2mul61342l91.jpg';
const imagePNG = 'https://user-images.githubusercontent.com/47038980/205175493-fc1f7fdd-d10a-4099-88c4-146bac69e223.png';
const imageSVG = 'https://i.redd.it/t2mul61342l91.svg';
const imageUrlWithQueryParams =
	'https://i.ytimg.com/vi/suFuJZCfC7g/hqdefault.jpg?sqp=-oaymwE2CNACELwBSFXyq4qpAygIARUAAIhCGAFwAcABBvABAfgB_gmAAtAFigIMCAAQARhlIGUoZTAP&rs=AOn4CLB_0OCFNuoCRBlaTJEa2PPOOHxkbQ';

describe("Evaluate if the link is returning an image's type", () => {
	test('return true when the link ends with .jpg', () => {
		const result = isImage(imageJPG);
		expect(result).toBe(true);
	});
	test('return true when the link ends with .png', () => {
		const result = isImage(imagePNG);
		expect(result).toBe(true);
	});
	test('return false when the link ends with .svg', () => {
		const result = isImage(imageSVG);
		expect(result).toBe(false);
	});
	test('return true when the link ends with .jpg and query params', () => {
		const result = isImage(imageUrlWithQueryParams);
		expect(result).toBe(true);
	});
});
