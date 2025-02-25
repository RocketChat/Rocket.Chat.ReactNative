import React from 'react';
import { View, StyleSheet } from 'react-native';

import { IAvatar } from '../../definitions';
import Avatar from '../../containers/Avatar';
import { useTheme } from '../../theme';
import i18n from '../../i18n';

const styles = StyleSheet.create({
	container: {
		width: 64,
		height: 64,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 20,

		borderRadius: 4
	}
});

const AvatarSuggestionItem = ({
	item,
	onPress,
	text,
	testID
}: {
	item?: IAvatar;
	testID?: string;
	onPress: Function;
	text?: string;
}) => {
	const { colors } = useTheme();

	return (
		<View key={item?.service} testID={testID} style={[styles.container, { backgroundColor: colors.strokeLight }]}>
			<Avatar
				accessibilityLabel={i18n.t('Select_Uploaded_Image')}
				avatar={item?.url}
				text={text}
				size={64}
				onPress={() => onPress(item)}
			/>
		</View>
	);
};

export default AvatarSuggestionItem;
