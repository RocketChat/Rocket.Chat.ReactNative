import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import Collapse from './components/Collapse';
import Title from './components/Title';
import EndCall from './components/EndCall';
import { useCallStore } from '../../lib/services/voip/useCallStore';

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

	const defaultHeaderStyle = {
		backgroundColor: colors.surfaceNeutral,
		paddingTop: insets.top
	};

	const call = useCallStore(state => state.call);
	if (!call) {
		return <View style={defaultHeaderStyle} />;
	}

	return (
		<View style={[styles.header, { ...defaultHeaderStyle, borderBottomColor: colors.strokeLight }]}>
			<Collapse />
			<Title />
			<EndCall />
		</View>
	);
};

export default CallHeader;
