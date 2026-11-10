import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '~/theme';
import {
	formatVoipDebugLogEntry,
	formatVoipDebugLogs,
	useVoipDebugLogStore,
	type VoipDebugLogEntry
} from '~/lib/services/voip/voipDebugLog';

const levelColor = (level: VoipDebugLogEntry['level'], fallback: string) => {
	switch (level) {
		case 'error':
			return '#EC0D2A';
		case 'warn':
			return '#F38C39';
		case 'debug':
			return '#9EA2A8';
		default:
			return fallback;
	}
};

export const VoipLogsButton = () => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();
	const [visible, setVisible] = useState(false);
	const [copied, setCopied] = useState(false);
	const entries = useVoipDebugLogStore(state => state.entries);
	const clear = useVoipDebugLogStore(state => state.clear);
	const errorCount = entries.filter(entry => entry.level === 'error').length;

	const copy = () => {
		Clipboard.setString(formatVoipDebugLogs());
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<>
			<Pressable
				testID='voip-logs-button'
				onPress={() => setVisible(true)}
				style={[
					styles.fab,
					{
						bottom: insets.bottom + 90,
						backgroundColor: errorCount ? '#EC0D2A' : colors.buttonBackgroundPrimaryDefault
					}
				]}>
				<Text style={styles.fabText}>LOG</Text>
				<Text style={styles.fabCount}>{errorCount ? `${errorCount}!` : entries.length}</Text>
			</Pressable>
			<Modal visible={visible} animationType='slide' onRequestClose={() => setVisible(false)}>
				<View style={[styles.container, { backgroundColor: colors.surfaceLight, paddingTop: insets.top }]}>
					<View style={[styles.toolbar, { borderColor: colors.strokeLight }]}>
						<Text style={[styles.title, { color: colors.fontDefault }]}>VoIP logs ({entries.length})</Text>
						<Pressable testID='voip-logs-copy' onPress={copy} style={styles.action}>
							<Text style={[styles.actionText, { color: colors.buttonBackgroundPrimaryDefault }]}>
								{copied ? 'Copied' : 'Copy'}
							</Text>
						</Pressable>
						<Pressable testID='voip-logs-clear' onPress={clear} style={styles.action}>
							<Text style={[styles.actionText, { color: colors.buttonBackgroundPrimaryDefault }]}>Clear</Text>
						</Pressable>
						<Pressable testID='voip-logs-close' onPress={() => setVisible(false)} style={styles.action}>
							<Text style={[styles.actionText, { color: colors.buttonBackgroundPrimaryDefault }]}>Close</Text>
						</Pressable>
					</View>
					<FlatList
						data={entries}
						keyExtractor={item => String(item.id)}
						contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
						renderItem={({ item }) => (
							<Text
								selectable
								style={[
									styles.entry,
									{
										color: levelColor(item.level, colors.fontDefault),
										borderColor: colors.strokeLight
									}
								]}>
								{formatVoipDebugLogEntry(item)}
							</Text>
						)}
					/>
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	fab: {
		position: 'absolute',
		right: 12,
		width: 52,
		height: 52,
		borderRadius: 26,
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 6,
		shadowColor: '#000',
		shadowOpacity: 0.3,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 }
	},
	fabText: { color: '#fff', fontSize: 11, fontWeight: '700' },
	fabCount: { color: '#fff', fontSize: 10 },
	container: { flex: 1 },
	toolbar: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: 1
	},
	title: { flex: 1, fontSize: 16, fontWeight: '700' },
	action: { paddingHorizontal: 8, paddingVertical: 4 },
	actionText: { fontSize: 15, fontWeight: '600' },
	entry: {
		fontFamily: 'Menlo',
		fontSize: 11,
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderBottomWidth: StyleSheet.hairlineWidth
	}
});
