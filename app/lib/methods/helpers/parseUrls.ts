import { type IUrl, type IUrlFromServer } from '~/definitions/IUrl';
import { buildImageURL } from './buildImageURL';

const toPositiveNumber = (value?: string): number | undefined => {
	const parsed = Number(value);
	return parsed > 0 && Number.isFinite(parsed) ? parsed : undefined;
};

const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	mdash: '—',
	ndash: '–',
	hellip: '…',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”'
};

const decodeEntities = (text: string): string =>
	text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
		if (entity[0] !== '#') {
			return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
		}
		const isHex = entity[1].toLowerCase() === 'x';
		const codePoint = parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
		return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : match;
	});

const getOembedText = (html?: string): string | undefined => {
	if (!html) {
		return undefined;
	}
	const markup = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
	const paragraphs = Array.from(markup.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), ([, content]) => content);
	const text = (paragraphs.length ? paragraphs.join(' ') : markup).replace(/<[^>]*>/g, ' ');
	return decodeEntities(text).replace(/\s+/g, ' ').trim() || undefined;
};

export default (urls: IUrlFromServer[]): IUrl[] =>
	urls
		.filter((url: IUrlFromServer) => (url.meta && !url.ignoreParse) || typeof (url as IUrl)._id === 'number')
		.map((url: IUrlFromServer, index) => {
			if (!(url.meta && !url.ignoreParse)) {
				return url as unknown as IUrl;
			}
			const tmp: IUrl = {} as any;
			const { meta } = url;
			tmp._id = index;
			tmp.title = meta.ogTitle || meta.twitterTitle || meta.title || meta.pageTitle || meta.oembedTitle || meta.oembedAuthorName;
			tmp.description =
				meta.ogDescription ||
				meta.twitterDescription ||
				meta.description ||
				getOembedText(meta.oembedHtml) ||
				(tmp.title === meta.oembedAuthorName ? '' : meta.oembedAuthorName);
			let decodedOgImage;
			if (meta.ogImage) {
				decodedOgImage = meta.ogImage.replace(/&amp;/g, '&');
			}
			tmp.image = decodedOgImage || meta.twitterImage || meta.oembedThumbnailUrl;
			if (tmp.image) {
				tmp.image = buildImageURL(url.url, tmp.image);
			}
			const imageWidth = toPositiveNumber(meta.ogImageWidth);
			const imageHeight = toPositiveNumber(meta.ogImageHeight);
			if (decodedOgImage && imageWidth && imageHeight) {
				tmp.imageWidth = imageWidth;
				tmp.imageHeight = imageHeight;
			}
			tmp.url = url.url;
			return tmp;
		});
