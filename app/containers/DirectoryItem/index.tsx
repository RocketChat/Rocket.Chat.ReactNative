import React from 'react';
import { Text, View, ViewStyle, Platform } from 'react-native';

import Touch from '../Touch';
import Avatar from '../Avatar';
import RoomTypeIcon from '../RoomTypeIcon';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../lib/constants';
import { TSupportedThemes, useTheme } from '../../theme';
import { CustomIcon } from '../CustomIcon';
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
	age?: string;
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
	age,
	teamMain
}: IDirectoryItem): React.ReactElement => {
	const { theme } = useTheme();

	return (
		<Touch onPress={onPress} style={{ backgroundColor: themes[theme].backgroundColor }} testID={testID}>
			<View
				style={[
					styles.directoryItemContainer,
					styles.directoryItemButton,
					style,
					{ backgroundColor: themes[theme].peerSupporterBackground }
				]}
			>
				<Avatar text={avatar} size={70} type={type} rid={rid} style={styles.directoryItemAvatar} />
				<View style={styles.directoryItemTextContainer}>
					<View style={styles.directoryItemTextTitle}>
						{type !== 'd' ? <RoomTypeIcon type={type} teamMain={teamMain} /> : null}
						<Text style={[styles.directoryItemName, { color: themes[theme].titleText }]} numberOfLines={1}>
							{title}
						</Text>
					</View>
					{description ? (
						<Text style={[styles.directoryItemUsername, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
							{description}
						</Text>
					) : null}
					{age ? (
						<Text style={[styles.directoryItemUsername, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>
							{age}
						</Text>
					) : null}
				</View>
				<DirectoryItemLabel text={rightLabel} theme={theme} />
				<CustomIcon name={'chevron-right'} size={36} color='#38b000' />
			</View>
		</Touch>
	);
};

export default DirectoryItem;
