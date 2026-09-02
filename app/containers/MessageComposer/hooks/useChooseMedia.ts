import * as DocumentPicker from 'expo-document-picker';
import { useContext } from 'react';

import { IMAGE_PICKER_CONFIG, LIBRARY_PICKER_CONFIG, VIDEO_PICKER_CONFIG } from '../constants';
import { forceJpgExtension } from '../helpers';
import I18n from '../../../i18n';
import { canUploadFile } from '../../../lib/methods/helpers';
import log from '../../../lib/methods/helpers/log';
import { getSubscriptionByRoomId } from '../../../lib/database/services/Subscription';
import { getThreadById } from '../../../lib/database/services/Thread';
import Navigation from '../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { useMessageAction, useMessageActionStoreApi, useQuotedMessageIds } from '../../message/stores/MessageActionStore';
import { type IShareAttachment } from '../../../definitions';
import ImagePicker, { type ImageOrVideo } from '../../../lib/methods/helpers/ImagePicker/ImagePicker';
import { MessageInnerContext } from '../context';
import { useMessageComposerApi } from '../store';
import { useAltTextSupported } from '../../../lib/hooks/useAltTextSupported';

const normalizeAttachment = (item: IShareAttachment) =>
	item.filename ? item : { ...item, filename: item.path ? item.path.split('/').pop() : undefined };

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
	const { addAttachments } = useMessageComposerApi();
	const { getText, setInput } = useContext(MessageInnerContext);
	const messageActionStore = useMessageActionStoreApi();
	const action = useMessageAction();
	const quotedMessageIds = useQuotedMessageIds();
	const altTextSupported = useAltTextSupported();
	const allowList = FileUpload_MediaTypeWhiteList as string;
	const maxFileSize = FileUpload_MaxFileSize as number;
	const libPickerLabels = {
		cropperChooseText: I18n.t('Choose'),
		cropperCancelText: I18n.t('Cancel'),
		loadingLabelText: I18n.t('Processing')
	};

	const takePhoto = async () => {
		try {
			let image = await ImagePicker.openCamera({ ...IMAGE_PICKER_CONFIG, ...libPickerLabels });
			image = forceJpgExtension(image);
			await handleSelectedAttachments([image as IShareAttachment]);
		} catch (e) {
			log(e);
		}
	};

	const takeVideo = async () => {
		try {
			const video = await ImagePicker.openCamera({ ...VIDEO_PICKER_CONFIG, ...libPickerLabels });
			await handleSelectedAttachments([video as IShareAttachment]);
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
			await handleSelectedAttachments(attachments as IShareAttachment[]);
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
				await handleSelectedAttachments([file]);
			}
		} catch (e) {
			log(e);
		}
	};

	const startShareView = () => {
		const text = getText();
		return {
			selectedMessages: quotedMessageIds,
			text
		};
	};

	const finishShareView = (text = '', quotes: string[] = []): void => {
		setInput(text);
		messageActionStore.getState().actions.setQuoteMessageIds(quotes);
	};

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
				action: action?.kind ?? null,
				finishShareView,
				startShareView
			});
		}
	};

	const prepareAttachments = (attachments: IShareAttachment[]) => {
		const items = attachments.map(item => {
			const normalizedItem = normalizeAttachment(item);
			const { success: canUpload, error } = canUploadFile({
				file: normalizedItem as IShareAttachment,
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

		addAttachments(items as IShareAttachment[]);
	};

	const handleSelectedAttachments = async (attachments: IShareAttachment[]) => {
		if (altTextSupported) {
			prepareAttachments(attachments);
			return;
		}

		await openShareView(attachments.map(item => normalizeAttachment(item)) as IShareAttachment[]);
	};

	return {
		takePhoto,
		takeVideo,
		chooseFromLibrary,
		chooseFile
	};
};
