import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { type IAvatar } from '../../definitions';
import Avatar from '../../containers/Avatar';

const styles = StyleSheet.create(theme => ({
	container: {
		width: 64,
		height: 64,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 20,
		borderRadius: 4,
		backgroundColor: theme.colors.strokeLight
	}
}));

const AvatarSuggestionItem = ({
	item,
	onPress,
	text,
	testID,
	accessibilityLabel
}: {
	item?: IAvatar;
	testID?: string;
	onPress: Function;
	text?: string;
	accessibilityLabel?: string;
}) => (
	<View key={item?.service} testID={testID} style={styles.container}>
		<Avatar accessibilityLabel={accessibilityLabel} avatar={item?.url} text={text} size={64} onPress={() => onPress(item)} />
	</View>
);

export default AvatarSuggestionItem;
