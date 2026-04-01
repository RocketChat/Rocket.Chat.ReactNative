import React, { useContext } from 'react';

import { getSubscriptionByRoomId } from '../../../../lib/database/services/Subscription';
import { BaseButton } from './BaseButton';
import { type TActionSheetOptionsItem, useActionSheet } from '../../../ActionSheet';
import { MessageInnerContext } from '../../context';
import I18n from '../../../../i18n';
import Navigation from '../../../../lib/navigation/appNavigation';
import { useAppSelector } from '../../../../lib/hooks/useAppSelector';
import { usePermissions } from '../../../../lib/hooks/usePermissions';
import { useCanUploadFile, useChooseMedia } from '../../hooks';
import { useRoomContext } from '../../../../views/RoomView/context';

export const ActionsButton = () => {
	'use memo';

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
					onClose: takePhoto
				},
				{
					title: I18n.t('Take_a_video'),
					icon: 'camera',
					onClose: takeVideo
				},
				{
					title: I18n.t('Choose_from_library'),
					icon: 'image',
					onClose: chooseFromLibrary
				},
				{
					title: I18n.t('Choose_file'),
					icon: 'attach',
					onClose: chooseFile
				}
			);
		}

		options.push({
			title: I18n.t('Create_Discussion'),
			icon: 'discussions',
			onClose: createDiscussion
		});

		closeEmojiKeyboardAndAction(showActionSheet, { options });
	};

	return <BaseButton onPress={onPress} testID='message-composer-actions' accessibilityLabel='Actions' icon='add' />;
};
