import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { IAvatar } from '../../definitions';
import I18n from '../../i18n';
import { Services } from '../../lib/services';
import { useTheme } from '../../theme';
import AvatarSuggestionItem from './AvatarSuggestionItem';
import styles from './styles';

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
		getAvatarSuggestion();
	}, []);

	return (
		<View style={styles.containerImagesUploaded}>
			<Text style={[styles.itemLabel, { color: colors.titleText }]}>{I18n.t('Images_uploaded')}</Text>
			<View style={styles.containerAvatarSuggestion}>
				{username && resetAvatar ? (
					<AvatarSuggestionItem text={`@${username}`} testID={`reset-avatar-suggestion`} onPress={resetAvatar} />
				) : null}
				{avatarSuggestions.slice(0, 7).map((item, index) => (
					<AvatarSuggestionItem key={index} item={item} testID={`${item?.service}-avatar-suggestion`} onPress={onPress} />
				))}
			</View>
		</View>
	);
};

export default AvatarSuggestion;
