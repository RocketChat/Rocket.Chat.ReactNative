import { type TIconsName } from '../../containers/CustomIcon';

export const getFileIcon = (format: string): TIconsName => {
	const fileFormat = format.toLowerCase();

	switch (fileFormat) {
		case 'pdf':
			return 'adobe-reader-monochromatic';

		// sheets
		case 'xls':
		case 'xlsx':
		case 'csv':
			return 'file-sheet';

		// presentations
		case 'pptx':
		case 'ppt':
			return 'engagement-dashboard';

		// other documents
		default:
			return 'file-document';
	}
};
