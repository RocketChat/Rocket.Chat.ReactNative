import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { IMAGE_PICKER_CONFIG, LIBRARY_PICKER_CONFIG, VIDEO_PICKER_CONFIG } from '../constants';
import I18n from '../../../i18n';
import { canUploadFile } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { getThreadById } from '../../../lib/database/services/Thread';
import Navigation from '../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../lib/hooks';
import { useRoomContext } from '../../../views/RoomView/context';
import ImagePicker from '../../../lib/methods/helpers/ImagePicker/ImagePicker';
import { mapMediaResult } from '../../../lib/methods/helpers/ImagePicker/mapMediaResult';
import { getPermissions } from '../../../lib/methods/helpers/ImagePicker/getPermissions';
import { IShareAttachment } from '../../../definitions';

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

	const takePhoto = async () => {
		try {
			await getPermissions('camera');
			const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_CONFIG);
			if (result.canceled) {
				return;
			}
			const media = mapMediaResult(result.assets);
			const canUploadResult = canUploadFile({
				file: media[0],
				allowList,
				maxFileSize,
				permissionToUploadFile: permissionToUpload
			});
			if (canUploadResult.success) {
				return openShareView(media);
			}

			handleError(canUploadResult.error);
		} catch (e) {
			log(e);
		}
	};

	const takeVideo = async () => {
		try {
			await getPermissions('camera');
			const result = await ImagePicker.launchCameraAsync(VIDEO_PICKER_CONFIG);
			if (result.canceled) {
				return;
			}
			const media = mapMediaResult(result.assets);
			const canUploadResult = canUploadFile({
				file: media[0],
				allowList,
				maxFileSize,
				permissionToUploadFile: permissionToUpload
			});
			if (canUploadResult.success) {
				return openShareView(media);
			}

			handleError(canUploadResult.error);
		} catch (e) {
			log(e);
		}
	};

	const chooseFromLibrary = async () => {
		try {
			await getPermissions('library');
			const result = await ImagePicker.launchImageLibraryAsync(LIBRARY_PICKER_CONFIG);
			if (result.canceled) {
				return;
			}
			const media = mapMediaResult(result.assets);
			openShareView(media);
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

	const openShareView = async (attachments: IShareAttachment[]) => {
		if (!rid) return;
		const room = await getSubscriptionByRoomId(rid);
		let thread;
		if (tmid) {
			thread = await getThreadById(tmid);
		}
		if (room) {
			const imageOnly = !attachments.some(item => item.mime?.startsWith('image/') === false);
			// FIXME: use useNavigation
			Navigation.navigate(imageOnly ? 'EditImageView' : 'ShareView', {
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
