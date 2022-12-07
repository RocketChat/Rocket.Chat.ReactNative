import React from 'react';
import { Text, View, Alert, TouchableOpacity } from 'react-native';

import { IAvatar } from '../../definitions';
import I18n from '../../i18n';
import Avatar from '../../containers/Avatar';
// import Touch from '../../containers/Touch';
import styles from './styles';
import { useTheme } from '../../theme';

const AvatarSuggestion = ({ avatarSuggestions }: { avatarSuggestions: IAvatar[] }) => {
	const { colors } = useTheme();
	const test = [
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions,
		...avatarSuggestions
	];
	const renderItem = () =>
		test.slice(0, 8).map(item => (
			<TouchableOpacity
				key={item.service}
				testID={`${item.service}-avatar-suggestion`}
				onPress={() => Alert.alert('aqui')}
				style={[styles.avatarButton, { backgroundColor: colors.borderColor }]}
			>
				<Avatar avatar={item.url} size={64} />
			</TouchableOpacity>
		));

	return (
		<View style={{ flex: 1 }}>
			<Text style={styles.itemLabel}>{I18n.t('Images_uploaded')}</Text>
			<View style={styles.containerAvatarSuggestion}>{renderItem()}</View>
		</View>
	);
};

export default AvatarSuggestion;
