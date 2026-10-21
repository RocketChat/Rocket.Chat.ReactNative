import { type IUrl, type IUrlFromServer } from '~/definitions';
import { buildImageURL } from './buildImageURL';

const toPositiveNumber = (value?: string): number | undefined => {
	const parsed = Number(value);
	return parsed > 0 && Number.isFinite(parsed) ? parsed : undefined;
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
			tmp.title = meta.ogTitle || meta.twitterTitle || meta.title || meta.pageTitle || meta.oembedTitle;
			tmp.description = meta.ogDescription || meta.twitterDescription || meta.description || meta.oembedAuthorName;
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
