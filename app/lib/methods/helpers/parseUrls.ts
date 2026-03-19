import { type IUrl, type IUrlFromServer } from '../../../definitions';
import { buildImageURL } from './buildImageURL';

export default (urls: IUrlFromServer[]): IUrl[] =>
	urls
		.filter((url: IUrlFromServer) => url.meta && !url.ignoreParse)
		.map((url: IUrlFromServer, index) => {
			const { meta } = url;
			let image = meta.ogImage ? meta.ogImage.replace(/&amp;/g, '&') : meta.twitterImage || meta.oembedThumbnailUrl;
			if (image) {
				image = buildImageURL(url.url, image);
			}
			const tmp: IUrl = {
				...url,
				_id: index,
				title: meta.ogTitle || meta.twitterTitle || meta.title || meta.pageTitle || meta.oembedTitle,
				description: meta.ogDescription || meta.twitterDescription || meta.description || meta.oembedAuthorName,
				image: image || ''
			};
			return tmp;
		});
