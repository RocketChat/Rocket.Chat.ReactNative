export interface IUrlFromServer {
	url: string;
	meta: {
		pageTitle: string;
		description: string;
		fbAppId: string;
		twitterImageSrc: string;
		twitterSite: string;
		twitterCard: string;
		twitterTitle: string;
		twitterDescription: string;
		ogImage: string;
		ogImageAlt: string;
		ogImageWidth: string;
		ogImageHeight: string;
		ogSiteName: string;
		ogType: string;
		ogTitle: string;
		ogUrl: string;
		ogDescription: string;
		title: string;
		oembedTitle: string;
		oembedAuthorName: string;
		twitterImage: string;
		oembedThumbnailUrl: string;
	};
	headers: {
		contentType: string;
	};
	parsedUrl?: {
		host: string;
		hash: any;
		pathname: string;
		protocol: string;
		port: any;
		query: any;
		search: any;
		hostname: string;
	};
	ignoreParse: boolean;
}

export interface IUrl extends IUrlFromServer {
	_id: number;
	title: string;
	description: string;
	image: string;
}
