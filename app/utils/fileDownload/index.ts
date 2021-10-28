import RNFetchBlob from 'rn-fetch-blob';
import FileViewer from 'react-native-file-viewer';

interface IAttachment {
	title: string;
	title_link: string;
	type: string;
	description: string;
}

const DOCUMENT_PATH = `${RNFetchBlob.fs.dirs.DocumentDir}/`;

export const getExtensionType = (text: string) => text.split('.').pop();

export const fileDownload = async (url: string, attachment: IAttachment) => {
	const fileName = attachment.title.split('.')[0];

	const options = {
		path: `${DOCUMENT_PATH}${fileName}.${getExtensionType(attachment.title_link)}`,
		fileCache: true,
		timeout: 10000,
		indicator: true,
		overwrite: true
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
