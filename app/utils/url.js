export const isValidURL = (url) => {
	const pattern = new RegExp('^(https?:\\/\\/)?' // protocol
		+ '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
		+ '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
		+ '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
		+ '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
		+ '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
	return !!pattern.test(url);
};

// Use useSsl: false only if server url starts with http://
export const useSsl = url => !/http:\/\//.test(url);
