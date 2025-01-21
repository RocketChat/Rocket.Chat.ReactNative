import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { IMAGE_PICKER_CONFIG, LIBRARY_PICKER_CONFIG, VIDEO_PICKER_CONFIG } from '../constants';
// import { forceJpgExtension } from '../helpers';
import I18n from '../../../i18n';
import { canUploadFile } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { getThreadById } from '../../../lib/database/services/Thread';
import Navigation from '../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../lib/hooks';
import { useRoomContext } from '../../../views/RoomView/context';
import ImagePicker from '../../../lib/methods/helpers/ImagePicker/ImagePicker';

export const useChooseMedia = ({
	rid,
	tmid,
	permissionToUpload
}: {
	rid?: string;
	tmid?: string;
	permissionToUpload: boolean;
}) => {
	const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = useAppSelector(state => state.settings);
	const { action, setQuotesAndText, selectedMessages, getText } = useRoomContext();
	const allowList = FileUpload_MediaTypeWhiteList as string;
	const maxFileSize = FileUpload_MaxFileSize as number;
	const libPickerLabels = {
		cropperChooseText: I18n.t('Choose'),
		cropperCancelText: I18n.t('Cancel'),
		loadingLabelText: I18n.t('Processing')
	};

	const takePhoto = async () => {
		try {
			const result = await ImagePicker.launchCameraAsync({ ...IMAGE_PICKER_CONFIG, ...libPickerLabels });
			if (result.canceled) {
				return;
			}
			const image = result.assets[0];
			console.log('🚀 ~ takePhoto ~ image:', image);
			// image = forceJpgExtension(image);
			const file = image as any; // FIXME: unify those types to remove the need for any
			const canUploadResult = canUploadFile({
				file,
				allowList,
				maxFileSize,
				permissionToUploadFile: permissionToUpload
			});
			console.log('🚀 ~ takePhoto ~ canUploadResult:', canUploadResult);
			if (canUploadResult.success) {
				return openShareView([image]);
			}

			handleError(canUploadResult.error);
		} catch (e) {
			log(e);
		}
	};

	const takeVideo = async () => {
		try {
			const result = await ImagePicker.launchCameraAsync({ ...VIDEO_PICKER_CONFIG, ...libPickerLabels });
			if (result.canceled) {
				return;
			}
			const video = result.assets[0];
			const file = video as any; // FIXME: unify those types to remove the need for any
			const canUploadResult = canUploadFile({
				file,
				allowList,
				maxFileSize,
				permissionToUploadFile: permissionToUpload
			});
			if (canUploadResult.success) {
				return openShareView([video]);
			}

			handleError(canUploadResult.error);
		} catch (e) {
			log(e);
		}
	};

	const chooseFromLibrary = async () => {
		try {
			// The type can be video or photo, however the lib understands that it is just one of them.
			const result = await ImagePicker.launchImageLibraryAsync({
				...LIBRARY_PICKER_CONFIG,
				...libPickerLabels
			});
			if (result.canceled) {
				return;
			}
			console.log('🚀 ~ chooseFromLibrary ~ attachments:', result);
			// const assets = result.assets.map(att => forceJpgExtension(att));
			openShareView(result.assets);
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
				} as any;
				const canUploadResult = canUploadFile({
					file,
					allowList,
					maxFileSize,
					permissionToUploadFile: permissionToUpload
				});
				if (canUploadResult.success) {
					return openShareView([file]);
				}
				handleError(canUploadResult.error);
			}
		} catch (e) {
			log(e);
		}
	};

	const startShareView = () => {
		const text = getText?.() || '';
		return {
			selectedMessages,
			text
		};
	};

	const finishShareView = (text = '', quotes = []) => setQuotesAndText?.(text, quotes);

	const openShareView = async (attachments: any) => {
		if (!rid) return;
		const room = await getSubscriptionByRoomId(rid);
		let thread;
		if (tmid) {
			thread = await getThreadById(tmid);
		}
		if (room) {
			// FIXME: use useNavigation
			Navigation.navigate('ShareView', {
				room,
				thread: thread || tmid,
				attachments,
				action,
				finishShareView,
				startShareView
			});
		}
	};

	const handleError = (error?: string) => {
		Alert.alert(I18n.t('Error_uploading'), error && I18n.isTranslated(error) ? I18n.t(error) : error);
	};

	return {
		takePhoto,
		takeVideo,
		chooseFromLibrary,
		chooseFile
	};
};
