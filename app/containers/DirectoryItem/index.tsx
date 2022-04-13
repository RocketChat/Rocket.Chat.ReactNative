import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import Touch from '../../utils/touch';
import Avatar from '../Avatar';
import RoomTypeIcon from '../RoomTypeIcon';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes, useTheme } from '../../theme';

export { ROW_HEIGHT };

interface IDirectoryItemLabel {
	text?: string;
	theme: TSupportedThemes;
}

interface IDirectoryItem {
	title: string;
	description: string;
	avatar: string;
	type: string;
	onPress(): void;
	testID: string;
	style?: ViewStyle;
	rightLabel?: string;
	rid?: string;
	teamMain?: boolean;
}

const DirectoryItemLabel = React.memo(({ text, theme }: IDirectoryItemLabel) => {
	if (!text) {
		return null;
	}
	return <Text style={[styles.directoryItemLabel, { color: themes[theme].auxiliaryText }]}>{text}</Text>;
});

const DirectoryItem = ({
	title,
	description,
	avatar,
	onPress,
	testID,
	style,
	rightLabel,
	type,
	rid,
	teamMain
}: IDirectoryItem): React.ReactElement => {
	const { theme } = useTheme();
	return (
		<Touch onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }} testID={testID} theme={theme}>
			<View style={[styles.directoryItemContainer, styles.directoryItemButton, style]}>
				<Avatar text={avatar} size={30} type={type} rid={rid} style={styles.directoryItemAvatar} />
				<View style={styles.directoryItemTextContainer}>
					<View style={styles.directoryItemTextTitle}>
						<RoomTypeIcon type={type} teamMain={teamMain} />
						<Text style={[styles.directoryItemName, { color: themes[theme].titleText }]} numberOfLines={1}>
							{title}
						</Text>
					</View>
					{description ? (
						<Text style={[styles.directoryItemUsername, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
							{description}
						</Text>
					) : null}
				</View>
				<DirectoryItemLabel text={rightLabel} theme={theme} />
			</View>
		</Touch>
	);
};

export default DirectoryItem;
