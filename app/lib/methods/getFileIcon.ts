import { type TIconsName } from '../../containers/CustomIcon';

export const getFileIcon = (filename: string): TIconsName => {
	if (filename.endsWith('.pdf')) return 'adobe-reader-monochromatic';
	// if (filename.endsWith('.doc') || filename.endsWith('.docx')) return 'another';
	// if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) return 'another';
	// if (filename.endsWith('.zip')) return 'another';
	return 'pin';
};
