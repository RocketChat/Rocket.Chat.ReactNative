import { useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Platform, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import I18n from '../i18n';
import { useTheme } from '../theme';
import SafeAreaView from '../containers/SafeAreaView';
import sharedStyles from './Styles';
import { headerRightActions } from '../lib/methods/helpers/navigation/headerActions';
import {
	clearDebugLogs,
	formatDebugLogEntry,
	getDebugLogs,
	subscribeDebugLogs,
	type IDebugLogEntry
} from '../lib/debugLog/debugLog';
import { type OutsideParamList } from '../stacks/types';

const styles = StyleSheet.create({
	item: {
		paddingHorizontal: 16,
		paddingVertical: 4
	},
	text: {
		...sharedStyles.textRegular,
		fontSize: 12,
		fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace'
	},
	empty: {
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter,
		padding: 24
	}
});

const shareLogs = () => Share.share({ message: getDebugLogs().map(formatDebugLogEntry).join('\n') });

const DebugLogsView = () => {
	const navigation = useNavigation<NativeStackNavigationProp<OutsideParamList, 'DebugLogsView'>>();
	const { colors } = useTheme();
	const [entries, setEntries] = useState(getDebugLogs);

	useEffect(() => subscribeDebugLogs(() => setEntries(getDebugLogs())), []);

	useLayoutEffect(() => {
		navigation.setOptions({
			title: I18n.t('Logs'),
			...headerRightActions([
				{ label: I18n.t('Share'), icon: 'share', testID: 'debug-logs-share', onPress: shareLogs },
				{ label: I18n.t('Clear'), icon: 'delete', testID: 'debug-logs-clear', onPress: clearDebugLogs }
			])
		});
	}, []);

	const levelColor = (level: IDebugLogEntry['level']) =>
		level === 'error' || level === 'warn' ? colors.fontDanger : colors.fontDefault;

	return (
		<SafeAreaView testID='debug-logs-view'>
			<FlatList
				data={entries.slice().reverse()}
				keyExtractor={(item, index) => `${item.ts}-${index}`}
				renderItem={({ item }) => (
					<View style={styles.item}>
						<Text style={[styles.text, { color: levelColor(item.level) }]}>{formatDebugLogEntry(item)}</Text>
					</View>
				)}
				ListEmptyComponent={<Text style={[styles.empty, { color: colors.fontSecondaryInfo }]}>{I18n.t('No_logs_yet')}</Text>}
			/>
		</SafeAreaView>
	);
};

export default DebugLogsView;
