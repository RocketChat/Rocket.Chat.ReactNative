export default urls => urls.filter(url => url.meta && !url.ignoreParse).map((url, index) => {
	const tmp = {};
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
		if (tmp.image.indexOf('//') === 0) {
			tmp.image = `${ url.parsedUrl.protocol }${ tmp.image }`;
		} else if (tmp.image.indexOf('/') === 0 && (url.parsedUrl && url.parsedUrl.host)) {
			tmp.image = `${ url.parsedUrl.protocol }//${ url.parsedUrl.host }${ tmp.image }`;
		}
	}
	tmp.url = url.url;
	return tmp;
});
