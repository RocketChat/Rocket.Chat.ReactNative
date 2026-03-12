import { type TIconsName } from '../../containers/CustomIcon';

export const getFileIcon = (filename: string): TIconsName => {
	const lowerFilename = filename.toLowerCase();
	if (lowerFilename.endsWith('.pdf')) return 'adobe-reader-monochromatic';
	// if (lowerFilename.endsWith('.doc') || lowerFilename.endsWith('.docx')) return 'another';
	// if (lowerFilename.endsWith('.xls') || lowerFilename.endsWith('.xlsx')) return 'another';
	// if (lowerFilename.endsWith('.zip')) return 'another';
	return 'document';
};
