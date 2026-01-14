import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import Collapse from './components/Collapse';
import Title from './components/Title';
import EndCall from './components/EndCall';

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingBottom: 4,
		borderBottomWidth: StyleSheet.hairlineWidth
	}
});

const CallHeader = () => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	// const call = useCallStore(state => state.call);

	return (
		<View
			style={[
				styles.header,
				{ backgroundColor: colors.surfaceNeutral, paddingTop: insets.top, borderBottomColor: colors.strokeLight }
			]}>
			<Collapse />
			<Title />
			<EndCall />
		</View>
	);
};

export default CallHeader;
