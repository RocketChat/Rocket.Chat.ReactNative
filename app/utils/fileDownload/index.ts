import RNFetchBlob from 'rn-fetch-blob';
import FileViewer from 'react-native-file-viewer';

interface IAttachment {
	title: string;
	title_link: string;
	type: string;
	description: string;
}

const DOCUMENT_PATH = `${RNFetchBlob.fs.dirs.DownloadDir}/`;

export const getExtensionType = (text: string): string | undefined => text.split('.').pop();

export const getLocalFilePathFromFile = (attachment: IAttachment): string => {
	const fileName = attachment.title.split('.')[0];
	return `${DOCUMENT_PATH}${fileName}.${getExtensionType(attachment.title_link)}`;
};

export const verifyIfFileExist = (path: string): Promise<boolean> => RNFetchBlob.fs.exists(path);

export const fileDownload = async (url: string, attachment: IAttachment) => {
	const path = getLocalFilePathFromFile(attachment);
	const options = {
		path,
		timeout: 10000,
		indicator: true,
		addAndroidDownloads: {
			path,
			description: 'downloading file...',
			notification: true,
			useDownloadManager: true
		}
	};

	const { data } = await RNFetchBlob.config(options)
		.fetch('GET', url)
		.then(res => res)
		.catch(err => err);
	return data;
};

export const filePreview = async (url: string, attachment: IAttachment): Promise<void> => {
	const path = getLocalFilePathFromFile(attachment);
	let file;

	if (!(await verifyIfFileExist(path))) {
		file = await fileDownload(url, attachment);
	}

	FileViewer.open(file || path)
		.then(res => {
			console.log('entrou no then *************');
			console.log(res);
		})
		.catch(err => {
			console.log('entrou no catch *************');
			console.error(err);
		});
};
