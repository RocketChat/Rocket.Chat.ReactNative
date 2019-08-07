export const canUploadFile = (file, serverInfo) => {
	const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = serverInfo;
	if (!(file && file.path)) {
		return true;
	}
	if (file.size > FileUpload_MaxFileSize) {
		return false;
	}
	// if white list is empty, all media types are enabled
	if (!FileUpload_MediaTypeWhiteList) {
		return true;
	}
	const allowedMime = FileUpload_MediaTypeWhiteList.split(',');
	if (allowedMime.includes(file.mime)) {
		return true;
	}
	const wildCardGlob = '/*';
	const wildCards = allowedMime.filter(item => item.indexOf(wildCardGlob) > 0);
	if (wildCards.includes(file.mime.replace(/(\/.*)$/, wildCardGlob))) {
		return true;
	}
	return false;
};
