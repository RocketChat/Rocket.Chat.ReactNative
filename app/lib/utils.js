export const formatAttachmentUrl = (attachmentUrl, userId, token, server) => (
	encodeURI(attachmentUrl.includes('http') ? attachmentUrl : `${ server }${ attachmentUrl }?rc_uid=${ userId }&rc_token=${ token }`)
);
