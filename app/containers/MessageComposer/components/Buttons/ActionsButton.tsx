import { useContext } from 'react';

import { getSubscriptionByRoomId } from '~/lib/database/services/Subscription';
import { BaseButton } from './BaseButton';
import { type TActionSheetOptionsItem, useActionSheet } from '~/containers/ActionSheet';
import { MessageInnerContext } from '~/containers/MessageComposer/context';
import I18n from '~/i18n';
import Navigation from '~/lib/navigation/appNavigation';
import { useMasterDetail } from '~/lib/hooks/useMasterDetail';
import { usePermissions } from '~/lib/hooks/usePermissions';
import { useCanUploadFile, useChooseMedia } from '~/containers/MessageComposer/hooks';
import { useComposerRid, useComposerTmid, useComposerType } from '~/containers/MessageComposer/ComposerStore';
import { UIActionButtonContext, useAppActionButtons } from '~/lib/apps';
import { triggerAppActionButton } from '~/lib/apps/triggerAppActionButton';

export const ActionsButton = () => {
	const rid = useComposerRid();
	const tmid = useComposerTmid();
	const t = useComposerType();
	const { closeEmojiKeyboardAndAction, getText } = useContext(MessageInnerContext);
	const permissionToUpload = useCanUploadFile(rid);
	const [permissionToViewCannedResponses] = usePermissions(['view-canned-responses'], rid);
	const { takePhoto, takeVideo, chooseFromLibrary, chooseFile } = useChooseMedia({
		rid,
		tmid,
		permissionToUpload
	});
	const { showActionSheet, hideActionSheet } = useActionSheet();
	const isMasterDetail = useMasterDetail();
	const appActions = useAppActionButtons({ context: UIActionButtonContext.MESSAGE_BOX_ACTION, rid });
	const aiActions = useAppActionButtons({ context: UIActionButtonContext.ROOM_ACTION, category: 'ai', rid });

	const createDiscussion = async () => {
		if (!rid) return;
		const subscription = await getSubscriptionByRoomId(rid);
		const params = { channel: subscription, showCloseModal: true };
		if (isMasterDetail) {
			Navigation.navigate('ModalStackNavigator', { screen: 'CreateDiscussionView', params });
		} else {
			Navigation.navigate('NewMessageStackNavigator', { screen: 'CreateDiscussionView', params });
		}
	};

	const onPress = () => {
		const options: TActionSheetOptionsItem[] = [];
		if (t === 'l' && permissionToViewCannedResponses) {
			options.push({
				title: I18n.t('Canned_Responses'),
				icon: 'canned-response',
				onPress: () => Navigation.navigate('CannedResponsesListView', { rid })
			});
		}
		if (permissionToUpload) {
			options.push(
				{
					title: I18n.t('Take_a_photo'),
					icon: 'camera-photo',
					onPress: () => {
						hideActionSheet();
						// This is necessary because the action sheet does not close properly on Android
						setTimeout(() => {
							takePhoto();
						}, 550);
					}
				},
				{
					title: I18n.t('Take_a_video'),
					icon: 'video',
					onPress: () => {
						hideActionSheet();
						// This is necessary because the action sheet does not close properly on Android
						setTimeout(() => {
							takeVideo();
						}, 550);
					}
				},
				{
					title: I18n.t('Choose_from_library'),
					icon: 'image',
					onPress: () => {
						hideActionSheet();
						// This is necessary because the action sheet does not close properly on Android
						setTimeout(() => {
							chooseFromLibrary();
						}, 550);
					}
				},
				{
					title: I18n.t('Choose_file'),
					icon: 'attach',
					onPress: () => chooseFile()
				}
			);
		}

		options.push({
			title: I18n.t('Create_Discussion'),
			icon: 'discussions',
			onPress: () => createDiscussion()
		});

		aiActions.forEach(({ id, label, button }) => {
			options.push({
				title: label,
				icon: 'stars',
				danger: button.variant === 'danger',
				testID: `message-composer-ai-action-${id}`,
				onPress: () => {
					triggerAppActionButton({ button, rid });
				}
			});
		});

		appActions.forEach(({ id, label, button }) => {
			options.push({
				title: label,
				icon: 'apps',
				danger: button.variant === 'danger',
				testID: `message-composer-app-action-${id}`,
				onPress: () => {
					triggerAppActionButton({ button, rid, tmid, message: getText() ?? '' });
				}
			});
		});

		closeEmojiKeyboardAndAction(showActionSheet, { options });
	};

	return <BaseButton onPress={onPress} testID='message-composer-actions' accessibilityLabel='Actions' icon='add' />;
};
