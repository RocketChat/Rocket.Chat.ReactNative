export const formatAttachmentUrl = (attachmentUrl, userId, token, server) => (
	encodeURI(attachmentUrl.startsWith('http') ? attachmentUrl : `${ server }${ attachmentUrl }?rc_uid=${ userId }&rc_token=${ token }`)
);
