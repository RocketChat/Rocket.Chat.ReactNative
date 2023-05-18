import { useContext } from 'react';

import { BaseButton } from './BaseButton';
import { TActionSheetOptionsItem, useActionSheet } from '../../ActionSheet';
import { MessageComposerContext } from '../context';
import I18n from '../../../i18n';

export const ActionsButton = () => {
	const { permissionToUpload, takePhoto, takeVideo, chooseFromLibrary } = useContext(MessageComposerContext);
	const { showActionSheet } = useActionSheet();

	const onPress = () => {
		// logEvent(events.ROOM_SHOW_BOX_ACTIONS);
		// const { goToCannedResponses } = this.props;

		const options: TActionSheetOptionsItem[] = [];
		// if (goToCannedResponses) {
		// 	options.push({
		// 		title: I18n.t('Canned_Responses'),
		// 		icon: 'canned-response',
		// 		onPress: () => goToCannedResponses()
		// 	});
		// }
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
					onPress: () => alert('tbd') // this.chooseFile
				}
			);
		}

		options.push({
			title: I18n.t('Create_Discussion'),
			icon: 'discussions',
			onPress: () => alert('tbd') // this.createDiscussion
		});

		// this.closeEmojiAndAction(showActionSheet, { options });
		showActionSheet({ options });
	};

	return <BaseButton onPress={() => onPress()} testID='messagebox-cancel-editing' accessibilityLabel='TBD' icon='add' />;
};
