import RNFetchBlob from 'rn-fetch-blob';
import FileViewer from 'react-native-file-viewer';

interface IAttachment {
	title: string;
	title_link: string;
	type: string;
	description: string;
}

const DOCUMENT_PATH = `${RNFetchBlob.fs.dirs.DownloadDir}/`;

export const getExtensionType = (text: string) => text.split('.').pop();

export const fileDownload = async (url: string, attachment: IAttachment) => {
	const fileName = attachment.title.split('.')[0];
	const path = `${DOCUMENT_PATH}${fileName}.${getExtensionType(attachment.title_link)}`;
	const options = {
		path,
		timeout: 10000,
		indicator: true,
		addAndroidDownloads: {
			path: `${DOCUMENT_PATH}${fileName}.${getExtensionType(attachment.title_link)}`,
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

export const filePreview = async (url: string, attachment: IAttachment) => {
	const file = await fileDownload(url, attachment);
	FileViewer.open(file)
		.then(res => {
			console.log('entrou no then *************');
			console.log(res);
		})
		.catch(err => {
			console.log('entrou no catch *************');
			console.error(err);
		});
};
