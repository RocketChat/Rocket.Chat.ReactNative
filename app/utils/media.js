export const canUploadFile = (file, allowList, maxFileSize, permissionToUploadFile) => {
	if (!(file && file.path)) {
		return { success: true };
	}
	if (maxFileSize > -1 && file.size > maxFileSize) {
		return { success: false, error: 'error-file-too-large' };
	}
	if (!permissionToUploadFile) {
		return { success: false, error: 'error-not-permission-to-upload-file' };
	}
	// if white list is empty, all media types are enabled
	if (!allowList || allowList === '*') {
		return { success: true };
	}
	const allowedMime = allowList.split(',');
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
