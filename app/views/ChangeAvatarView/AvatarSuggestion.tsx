import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';

import { type IAvatar } from '../../definitions';
import { getAvatarSuggestion } from '../../lib/services/restApi';
import I18n from '../../i18n';
import styles from './styles';
import { useTheme } from '../../theme';
import AvatarSuggestionItem from './AvatarSuggestionItem';

const AvatarSuggestion = ({
	onPress,
	username,
	resetAvatar
}: {
	onPress: (value: IAvatar) => void;
	username?: string;
	resetAvatar?: () => void;
}) => {
	const [avatarSuggestions, setAvatarSuggestions] = useState<IAvatar[]>([]);
	const defaultAvatarAccessibilityInfo =
		username && resetAvatar ? I18n.t('Avatar_default_photo', { username }) : I18n.t('Select_Uploaded_Image');

	const { colors } = useTheme();

	useEffect(() => {
		const handleGetAvatarSuggestion = async () => {
			try {
				const result = await getAvatarSuggestion();
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
			} catch {
				// do nothing
			}
		};
		handleGetAvatarSuggestion();
	}, []);

	return (
		<View style={styles.containerImagesUploaded}>
			<Text style={[styles.itemLabel, { color: colors.fontTitlesLabels }]}>{I18n.t('Images_uploaded')}</Text>
			<View style={styles.containerAvatarSuggestion}>
				{username && resetAvatar ? (
					<AvatarSuggestionItem
						accessibilityLabel={defaultAvatarAccessibilityInfo}
						text={`@${username}`}
						testID={`reset-avatar-suggestion`}
						onPress={resetAvatar}
					/>
				) : null}
				{avatarSuggestions.slice(0, 7).map(item => (
					<AvatarSuggestionItem
						accessibilityLabel={I18n.t('Select_Uploaded_Image')}
						item={item}
						key={item?.url}
						testID={`${item?.service}-avatar-suggestion`}
						onPress={onPress}
					/>
				))}
			</View>
		</View>
	);
};

export default AvatarSuggestion;
