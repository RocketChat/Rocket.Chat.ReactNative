import React from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import Avatar from '../../containers/Avatar';
import RoomTypeIcon from '../../containers/RoomTypeIcon';
import styles, { ROW_HEIGHT } from './styles';
import { themes } from '../../constants/colors';

export { ROW_HEIGHT };

const DirectoryItemLabel = React.memo(({ text, theme }) => {
	if (!text) {
		return null;
	}
	return <Text style={[styles.directoryItemLabel, { color: themes[theme].auxiliaryText }]}>{text}</Text>;
});

const DirectoryItem = ({
	title, description, avatar, onPress, testID, style, baseUrl, user, rightLabel, type, theme
}) => (
	<RectButton
		onPress={onPress}
		underlayColor={themes[theme].bannerBackground}
		style={{ backgroundColor: themes[theme].backgroundColor }}
		activeOpacity={1}
		testID={testID}
	>
		<View style={[styles.directoryItemContainer, styles.directoryItemButton, style]}>
			<Avatar
				text={avatar}
				size={30}
				type={type}
				style={styles.directoryItemAvatar}
				baseUrl={baseUrl}
				userId={user.id}
				token={user.token}
			/>
			<View style={styles.directoryItemTextContainer}>
				<View style={styles.directoryItemTextTitle}>
					<RoomTypeIcon type={type} theme={theme} />
					<Text style={[styles.directoryItemName, { color: themes[theme].titleText }]} numberOfLines={1}>{title}</Text>
				</View>
				{ description ? <Text style={[styles.directoryItemUsername, { color: themes[theme].auxiliaryText }]} numberOfLines={1}>{description}</Text> : null }
			</View>
			<DirectoryItemLabel text={rightLabel} theme={theme} />
		</View>
	</RectButton>
);

DirectoryItem.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	avatar: PropTypes.string,
	type: PropTypes.string,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}),
	baseUrl: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	style: PropTypes.any,
	rightLabel: PropTypes.string,
	theme: PropTypes.string
};

DirectoryItemLabel.propTypes = {
	text: PropTypes.string,
	theme: PropTypes.string
};

export default DirectoryItem;
