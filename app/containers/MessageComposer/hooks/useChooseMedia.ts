import * as DocumentPicker from 'expo-document-picker';

import { IMAGE_PICKER_CONFIG, LIBRARY_PICKER_CONFIG, VIDEO_PICKER_CONFIG } from '../constants';
import { forceJpgExtension } from '../helpers';
import I18n from '../../../i18n';
import { canUploadFile } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { type IShareAttachment } from '../../../definitions';
import ImagePicker, { type ImageOrVideo } from '../../../lib/methods/helpers/ImagePicker/ImagePicker';
import { useMessageComposerApi } from '../context';

export const useChooseMedia = ({ permissionToUpload }: { permissionToUpload: boolean }) => {
	'use memo';

	const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = useAppSelector(state => state.settings);
	const { addAttachments } = useMessageComposerApi();
	const allowList = FileUpload_MediaTypeWhiteList as string;
	const maxFileSize = FileUpload_MaxFileSize as number;
	const libPickerLabels = {
		cropperChooseText: I18n.t('Choose'),
		cropperCancelText: I18n.t('Cancel'),
		loadingLabelText: I18n.t('Processing')
	};

	const prepareAttachments = (attachments: IShareAttachment[]) => {
		const items = attachments.map(item => {
			const normalizedItem = item.filename ? item : { ...item, filename: item?.path?.split('/').pop() };
			const { success: canUpload, error } = canUploadFile({
				file: normalizedItem,
				allowList,
				maxFileSize,
				permissionToUploadFile: permissionToUpload
			});

			return {
				...normalizedItem,
				canUpload,
				error
			};
		});

		addAttachments(items);
	};

	const takePhoto = async () => {
		try {
			let image = await ImagePicker.openCamera({ ...IMAGE_PICKER_CONFIG, ...libPickerLabels });
			image = forceJpgExtension(image);
			prepareAttachments([image as unknown as IShareAttachment]);
		} catch (e) {
			log(e);
		}
	};

	const takeVideo = async () => {
		try {
			const video = await ImagePicker.openCamera({ ...VIDEO_PICKER_CONFIG, ...libPickerLabels });
			prepareAttachments([video as unknown as IShareAttachment]);
		} catch (e) {
			log(e);
		}
	};

	const chooseFromLibrary = async () => {
		try {
			// The type can be video or photo, however the lib understands that it is just one of them.
			let attachments = (await ImagePicker.openPicker({
				...LIBRARY_PICKER_CONFIG,
				...libPickerLabels
			})) as unknown as ImageOrVideo[]; // FIXME: type this
			attachments = attachments.map(att => forceJpgExtension(att));
			prepareAttachments(attachments as unknown as IShareAttachment[]);
		} catch (e) {
			log(e);
		}
	};

	const chooseFile = async () => {
		try {
			const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
			if (!res.canceled) {
				const [asset] = res.assets;
				const file = {
					filename: asset.name,
					size: asset.size,
					mime: asset.mimeType,
					path: asset.uri
				} as IShareAttachment;
				prepareAttachments([file]);
			}
		} catch (e) {
			log(e);
		}
	};

	return {
		takePhoto,
		takeVideo,
		chooseFromLibrary,
		chooseFile
	};
};
