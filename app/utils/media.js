export const canUploadFile = (file, serverInfo) => {
	const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = serverInfo;
	if (!(file && file.path)) {
		return { success: true };
	}
	if (FileUpload_MaxFileSize > -1 && file.size > FileUpload_MaxFileSize) {
		return { success: false, error: 'error-file-too-large' };
	}
	// if white list is empty, all media types are enabled
	if (!FileUpload_MediaTypeWhiteList || FileUpload_MediaTypeWhiteList === '*') {
		return { success: true };
	}
	const allowedMime = FileUpload_MediaTypeWhiteList.split(',');
	if (allowedMime.includes(file.mime)) {
		return { success: true };
	}
	const wildCardGlob = '/*';
	const wildCards = allowedMime.filter(item => item.indexOf(wildCardGlob) > 0);
	if (file.mime && wildCards.includes(file.mime.replace(/(\/.*)$/, wildCardGlob))) {
		return { success: true };
	}
	return { success: false, error: 'error-invalid-file-type' };
};
