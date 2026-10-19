import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { isAndroid } from '~/lib/methods/helpers';

const styles = StyleSheet.create({
	spacer: {
		flex: 0
	}
});

const TabBarClearance = () =>
	isAndroid ? <SafeAreaView edges={{ bottom: true }} insetType='interface' style={styles.spacer} /> : null;

export default TabBarClearance;
