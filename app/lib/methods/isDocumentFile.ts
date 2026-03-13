import { type IAttachment } from '../../definitions';

export const isDocumentFile = (attachment: IAttachment) => {
	if (attachment.type === 'file') {
		switch (attachment.format?.toLowerCase()) {
			case 'pdf':
			case 'xlsx':
			case 'xls':
			case 'csv':
			case 'pptx':
			case 'ppt':
			case 'docx':
			case 'doc':
				return true;
		}
	}
	return false;
};
