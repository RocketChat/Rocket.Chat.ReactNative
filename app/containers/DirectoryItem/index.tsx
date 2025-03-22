import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import Touch from '../Touch';
import Avatar from '../Avatar';
import RoomTypeIcon from '../RoomTypeIcon';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes, useTheme } from '../../theme';
import { MarkdownPreview } from '../markdown';

export { ROW_HEIGHT };

interface IDirectoryItemLabel {
	text?: string;
	theme: TSupportedThemes;
}

interface IDirectoryItem {
	title: string;
	description?: string;
	avatar?: string;
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
	return <Text style={[styles.directoryItemLabel, { color: themes[theme].fontSecondaryInfo }]}>{text}</Text>;
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
		<View accessible accessibilityLabel={`${title} ${rightLabel}`}>
			<Touch onPress={onPress} style={{ backgroundColor: themes[theme].surfaceRoom }} testID={testID}>
				<View style={[styles.directoryItemContainer, styles.directoryItemButton, style]}>
					<Avatar text={avatar} size={30} type={type} rid={rid} style={styles.directoryItemAvatar} />
					<View style={styles.directoryItemTextContainer}>
						<View style={styles.directoryItemTextTitle}>
							{type !== 'd' ? <RoomTypeIcon type={type} teamMain={teamMain} /> : null}
							<Text style={[styles.directoryItemName, { color: themes[theme].fontTitlesLabels }]} numberOfLines={1}>
								{title}
							</Text>
						</View>
						{description ? (
							<MarkdownPreview
								msg={description}
								style={[styles.directoryItemUsername, { color: themes[theme].fontSecondaryInfo }]}
								numberOfLines={1}
							/>
						) : null}
					</View>
					<DirectoryItemLabel text={rightLabel} theme={theme} />
				</View>
			</Touch>
		</View>
	);
};

export default DirectoryItem;
