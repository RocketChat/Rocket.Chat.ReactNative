import { Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import ImagePicker, { ImageOrVideo } from 'react-native-image-crop-picker';

import { imagePickerConfig, libraryPickerConfig, videoPickerConfig } from '../constants';
import { forceJpgExtension } from '../helpers';
import I18n from '../../../i18n';
import { canUploadFile } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { getThreadById } from '../../../lib/database/services/Thread';
import Navigation from '../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../lib/hooks';

export const useChooseMedia = ({
	rid,
	tmid,
	permissionToUpload
}: {
	rid: string;
	tmid?: string;
	permissionToUpload: boolean;
}) => {
	const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = useAppSelector(state => state.settings);
	const allowList = FileUpload_MediaTypeWhiteList as string;
	const maxFileSize = FileUpload_MaxFileSize as number;
	const libPickerLabels = {
		cropperChooseText: I18n.t('Choose'),
		cropperCancelText: I18n.t('Cancel'),
		loadingLabelText: I18n.t('Processing')
	};

	const takePhoto = async () => {
		// logEvent(events.ROOM_BOX_ACTION_PHOTO);
		try {
			let image = await ImagePicker.openCamera({ ...imagePickerConfig, ...libPickerLabels });
			image = forceJpgExtension(image);
			const file = image as any; // FIXME: unify those types to remove the need for any
			const canUploadResult = canUploadFile({
				file,
				allowList,
				maxFileSize,
				permissionToUploadFile: permissionToUpload
			});
			if (canUploadResult.success) {
				return openShareView([image]);
			}

			handleError(canUploadResult.error);
		} catch (e) {
			log(e);
		}
	};

	const takeVideo = async () => {
		// logEvent(events.ROOM_BOX_ACTION_VIDEO);
		try {
			const video = await ImagePicker.openCamera({ ...videoPickerConfig, ...libPickerLabels });
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
			// logEvent(events.ROOM_BOX_ACTION_VIDEO_F);
		}
	};

	const chooseFromLibrary = async () => {
		// logEvent(events.ROOM_BOX_ACTION_LIBRARY);
		try {
			// The type can be video or photo, however the lib understands that it is just one of them.
			let attachments = (await ImagePicker.openPicker({
				...libraryPickerConfig,
				...libPickerLabels
			})) as unknown as ImageOrVideo[]; // FIXME: type this
			attachments = attachments.map(att => forceJpgExtension(att));
			openShareView(attachments);
		} catch (e) {
			log(e);
			// logEvent(events.ROOM_BOX_ACTION_LIBRARY_F);
		}
	};

	const chooseFile = async () => {
		// logEvent(events.ROOM_BOX_ACTION_FILE);
		try {
			const res = await DocumentPicker.pickSingle({
				type: [DocumentPicker.types.allFiles]
			});
			const file = {
				filename: res.name,
				size: res.size,
				mime: res.type,
				path: res.uri
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
		} catch (e: any) {
			if (!DocumentPicker.isCancel(e)) {
				// logEvent(events.ROOM_BOX_ACTION_FILE_F);
				log(e);
			}
		}
	};

	const openShareView = async (attachments: any) => {
		// const { message, replyCancel, replyWithMention, replying } = this.props;
		// // Start a thread with an attachment
		// let value: TThreadModel | IMessage = this.thread;
		// if (replyWithMention) {
		// 	value = message;
		// 	replyCancel();
		// }

		const room = await getSubscriptionByRoomId(rid);
		let thread;
		if (tmid) {
			thread = await getThreadById(tmid);
		}
		if (room) {
			// FIXME: use useNavigation
			Navigation.navigate('ShareView', {
				room,
				thread,
				attachments,
				replying: false
				// replyingMessage: message,
				// closeReply: replyCancel
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
