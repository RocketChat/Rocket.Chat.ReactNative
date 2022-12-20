import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';

import { IAvatar, IUser } from '../../definitions';
import { Services } from '../../lib/services';
import I18n from '../../i18n';
import Avatar from '../../containers/Avatar';
import styles from './styles';
import { useTheme } from '../../theme';
import Touch from '../../containers/Touch';

const Item = ({ item, onPress, text, testID }: { item?: IAvatar; testID?: string; onPress: Function; text?: string }) => {
	const { colors } = useTheme();

	return (
		<Touch
			key={item?.service}
			testID={testID}
			onPress={() => onPress(item)}
			style={[styles.avatarButton, { backgroundColor: colors.borderColor }]}
		>
			<Avatar avatar={item?.url} text={text} size={64} />
		</Touch>
	);
};
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
					<Item text={`@${user.username}`} testID={`reset-avatar-suggestion`} onPress={resetAvatar} />
				) : null}
				{avatarSuggestions.slice(0, 7).map(item => (
					<Item item={item} testID={`${item?.service}-avatar-suggestion`} onPress={onPress} />
				))}
			</View>
		</View>
	);
};

export default AvatarSuggestion;
