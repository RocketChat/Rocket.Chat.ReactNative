import React, { useContext } from 'react';

import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { BaseButton } from './BaseButton';
import { TActionSheetOptionsItem, useActionSheet } from '../../../ActionSheet';
import { MessageInnerContext } from '../../context';
import I18n from '../../../../i18n';
import Navigation from '../../../../lib/navigation/appNavigation';
import { useAppSelector, usePermissions } from '../../../../lib/hooks';
import { useCanUploadFile, useChooseMedia } from '../../hooks';
import { useRoomContext } from '../../../../views/RoomView/context';

export const ActionsButton = () => {
	const { rid, tmid, t } = useRoomContext();
	const { closeEmojiKeyboardAndAction } = useContext(MessageInnerContext);
	const permissionToUpload = useCanUploadFile(rid);
	const [permissionToViewCannedResponses] = usePermissions(['view-canned-responses'], rid);
	const { takePhoto, takeVideo, chooseFromLibrary, chooseFile } = useChooseMedia({
		rid,
		tmid,
		permissionToUpload
	});
	const { showActionSheet } = useActionSheet();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

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
					onPress: () => takePhoto()
				},
				{
					title: I18n.t('Take_a_video'),
					icon: 'camera',
					onPress: () => takeVideo()
				},
				{
					title: I18n.t('Choose_from_library'),
					icon: 'image',
					onPress: () => chooseFromLibrary()
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

		closeEmojiKeyboardAndAction(showActionSheet, { options });
	};

	return <BaseButton onPress={onPress} testID='message-composer-actions' accessibilityLabel='Message_actions' icon='add' />;
};
