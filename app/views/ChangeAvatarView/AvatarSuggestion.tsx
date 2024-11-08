import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';

import { IAvatar } from '../../definitions';
import { Services } from '../../lib/services';
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

	const { colors } = useTheme();

	useEffect(() => {
		const getAvatarSuggestion = async () => {
			try {
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
			} catch {
				// do nothing
			}
		};
		getAvatarSuggestion();
	}, []);

	return (
		<View style={styles.containerImagesUploaded}>
			<Text style={[styles.itemLabel, { color: colors.fontTitlesLabels }]}>{I18n.t('Images_uploaded')}</Text>
			<View style={styles.containerAvatarSuggestion}>
				{username && resetAvatar ? (
					<AvatarSuggestionItem text={`@${username}`} testID={`reset-avatar-suggestion`} onPress={resetAvatar} />
				) : null}
				{avatarSuggestions.slice(0, 7).map(item => (
					<AvatarSuggestionItem item={item} key={item?.url} testID={`${item?.service}-avatar-suggestion`} onPress={onPress} />
				))}
			</View>
		</View>
	);
};

export default AvatarSuggestion;
