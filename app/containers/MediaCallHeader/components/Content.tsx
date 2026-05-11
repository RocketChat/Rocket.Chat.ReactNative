import { Pressable, StyleSheet, View } from 'react-native';

import { useAppSelector } from '../../../lib/hooks/useAppSelector';
import { navigateToCallRoom } from '../../../lib/services/voip/navigateToCallRoom';
import { useCallStore } from '../../../lib/services/voip/useCallStore';
import Title from './Title';
import Subtitle from './Subtitle';

const styles = StyleSheet.create({
	button: {
		flex: 1,
		paddingHorizontal: 4
	},
	container: {
		flexGrow: 1,
		flexDirection: 'column',
		justifyContent: 'space-evenly',
		alignItems: 'flex-start'
	}
});

export const Content = () => {
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
	const roomId = useCallStore(state => state.roomId);
	const contentDisabled = roomId == null;
	const pressableStyle = contentDisabled ? [styles.button, { opacity: 0.5 }] : styles.button;

	return (
		<Pressable
			testID='media-call-header-content'
			disabled={contentDisabled}
			onPress={() => {
				navigateToCallRoom({ isMasterDetail }).catch(() => undefined);
			}}
			style={pressableStyle}>
			<View style={styles.container}>
				<Title />
				<Subtitle />
			</View>
		</Pressable>
	);
};
