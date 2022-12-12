import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';

import { IAvatar, IUser } from '../../definitions';
import { Services } from '../../lib/services';
import I18n from '../../i18n';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import { useTheme } from '../../theme';

const Item = ({ item, onPress, text }: { item?: IAvatar; onPress: (value?: IAvatar) => void; text?: string }) => {
	const { colors } = useTheme();

	return (
		<TouchableOpacity
			key={item?.service}
			testID={`${item?.service}-avatar-suggestion`}
			onPress={() => onPress(item)}
			style={[styles.avatarButton, { backgroundColor: colors.borderColor }]}
		>
			<Avatar avatar={item?.url} text={text} size={64} />
		</TouchableOpacity>
	);
};
const AvatarSuggestion = ({
	onPress,
	user,
	resetAvatar
}: {
	onPress: (value?: IAvatar) => void;
	user?: IUser;
	resetAvatar?: () => void;
}) => {
	const [avatarSuggestions, setAvatarSuggestions] = useState<IAvatar[]>([]);

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
			<Text style={styles.itemLabel}>{I18n.t('Images_uploaded')}</Text>
			<View style={styles.containerAvatarSuggestion}>
				{user?.username && resetAvatar ? <Item text={`@${user.username}`} onPress={resetAvatar} /> : null}
				{avatarSuggestions.slice(0, 7).map(item => (
					<Item item={item} onPress={onPress} />
				))}
			</View>
		</View>
	);
};

export default AvatarSuggestion;
