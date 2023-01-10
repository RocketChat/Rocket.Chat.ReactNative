import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';

import { IAvatar, IUser } from '../../definitions';
import { Services } from '../../lib/services';
import I18n from '../../i18n';
import styles from './styles';
import { useTheme } from '../../theme';
import AvatarSuggestionItem from './AvatarSuggestionItem';

const AvatarSuggestion = ({
	onPress,
	user,
	resetAvatar
}: {
	onPress: (value: IAvatar | null) => void;
	user?: IUser;
	resetAvatar?: () => void;
}) => {
	const [avatarSuggestions, setAvatarSuggestions] = useState<IAvatar[]>([]);

	const { colors } = useTheme();

	const getAvatarSuggestion = async () => {
		const result = await Services.getAvatarSuggestion();
		const suggestions = Object.keys(result).map(service => {
			const { url, blob, contentType } = result[service];
			return {
				url,
				data: blob,
				service,
				contentType
			};
		});
		setAvatarSuggestions(suggestions);
	};

	useEffect(() => {
		getAvatarSuggestion();
	}, []);

	return (
		<View style={{ flex: 1 }}>
			<Text style={[styles.itemLabel, { color: colors.titleText }]}>{I18n.t('Images_uploaded')}</Text>
			<View style={styles.containerAvatarSuggestion}>
				{user?.username && resetAvatar ? (
					<AvatarSuggestionItem text={`@${user.username}`} testID={`reset-avatar-suggestion`} onPress={resetAvatar} />
				) : null}
				{avatarSuggestions.slice(0, 7).map(item => (
					<AvatarSuggestionItem item={item} testID={`${item?.service}-avatar-suggestion`} onPress={onPress} />
				))}
			</View>
		</View>
	);
};

export default AvatarSuggestion;
