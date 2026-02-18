import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { useTheme } from '../../theme';
import Collapse from './components/Collapse';
import EndCall from './components/EndCall';
import { useCallStore } from '../../lib/services/voip/useCallStore';
import { Content } from './components/Content';

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingBottom: 12,
		borderBottomWidth: StyleSheet.hairlineWidth
	}
});

const MediaCallHeader = () => {
	'use memo';

	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const call = useCallStore(useShallow(state => state.call));

	const defaultHeaderStyle = {
		backgroundColor: colors.surfaceNeutral,
		paddingTop: insets.top
	};

	if (!call) {
		return <View style={defaultHeaderStyle} testID='media-call-header-empty' />;
	}

	return (
		<View
			style={[styles.header, { ...defaultHeaderStyle, borderBottomColor: colors.strokeLight, paddingTop: insets.top + 12 }]}
			testID='media-call-header'>
			<Collapse />
			<Content />
			<EndCall />
		</View>
	);
};

export default MediaCallHeader;
