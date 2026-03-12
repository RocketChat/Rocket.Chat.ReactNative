import { type IAttachment } from '../../definitions';

export const isDocumentFile = (attachment: IAttachment) => {
	if (attachment.type === 'file') {
		switch (attachment.format?.toLowerCase()) {
			case 'pdf':
				return true;
			case 'xlsx':
				return true;
			case 'xls':
				return true;
			case 'csv':
				return true;
			case 'pptx':
				return true;
			case 'ppt':
				return true;
		}
	}
	return false;
};
