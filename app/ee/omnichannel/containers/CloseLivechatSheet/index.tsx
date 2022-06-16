import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import I18n from '../../../../i18n';
import FormTextInput from '../../../../containers/TextInput/FormTextInput';
import FooterButtons from '../../../../containers/ActionSheet/FooterButtons';
import { useTheme } from '../../../../theme';
import sharedStyles from '../../../../views/Styles';

const styles = StyleSheet.create({
	titleText: {
		fontSize: 16,
		...sharedStyles.textSemibold,
		marginBottom: 16
	},
	subtitleText: {
		fontSize: 14,
		...sharedStyles.textRegular,
		marginBottom: 10
	}
});

const CloseLivechatSheet = ({
	onSubmit = () => {},
	onCancel = () => {}
}: {
	onSubmit: (comment: string) => void;
	onCancel: () => void;
}) => {
	const { theme, colors } = useTheme();
	const [comment, setComment] = useState('');
	return (
		<View style={sharedStyles.containerScrollView}>
			<Text style={styles.titleText}>{I18n.t('Closing_chat')}</Text>
			<Text style={styles.subtitleText}>{I18n.t('Please_add_a_comment')}</Text>
			<FormTextInput
				value={comment}
				onChangeText={value => setComment(value)}
				onSubmitEditing={() => (comment ? onSubmit(comment) : {})}
				theme={theme}
				testID='room-actions-view-close-livechat'
				inputStyle={{ borderWidth: 2 }}
				bottomSheet
			/>
			<FooterButtons
				confirmBackgroundColor={colors.actionTintColor}
				cancelAction={onCancel}
				confirmAction={() => onSubmit(comment)}
				cancelTitle={I18n.t('Cancel')}
				confirmTitle={I18n.t('Save')}
				disabled={!comment}
			/>
		</View>
	);
};

export default CloseLivechatSheet;
