import React from 'react';
import { Text, View, ViewStyle } from 'react-native';

import Touch from '../../utils/touch';
import Avatar from '../../containers/Avatar';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../constants/colors';

export { ROW_HEIGHT };

interface IDirectoryItemLabel {
	text?: string;
	theme: string;
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
	theme: string;
	featured?: boolean;
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
	theme,
	featured = false,
	teamMain
}: IDirectoryItem): JSX.Element => (
	<Touch onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }} testID={testID} theme={theme}>
		<View style={[styles.directoryItemContainer, styles.directoryItemButton, style]}>
			<Avatar text={avatar} size={30} type={type} rid={rid} style={styles.directoryItemAvatar} />
			<View style={styles.directoryItemTextContainer}>
				<View style={styles.directoryItemTextTitle}>
					<RoomTypeIcon type={type} teamMain={teamMain} theme={theme} />
					<Text style={[styles.directoryItemName, { color: themes[theme].titleText }]} numberOfLines={1}>
						{title}
					</Text>
					{featured && (
						<View style={[styles.featured, { backgroundColor: themes[theme].actionTintColor }]}>
							<Text style={[{ color: themes[theme].previewTintColor, fontSize: 12 }]}>Featured</Text>
						</View>
					)}
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

export default DirectoryItem;
