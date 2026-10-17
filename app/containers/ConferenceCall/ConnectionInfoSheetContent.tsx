import prettyBytes from 'pretty-bytes';
import { type ReactElement } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import I18n from '~/i18n';
import { useActionSheet } from '~/containers/ActionSheet';
import { useConferenceRoomStore } from '~/lib/services/conference/useConferenceRoomStore';
import { type TColors, useTheme } from '~/theme';
import sharedStyles from '~/views/Styles';
import ConferenceSheetHeader from './ConferenceSheetHeader';
import { useConferenceDiagnostics } from './useConferenceDiagnostics';

const QUALITY_DOT_SIZE = 8;
const NOT_AVAILABLE = '—';
const KBPS_PER_MBPS = 1000;

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	waiting: {
		...sharedStyles.textRegular,
		paddingHorizontal: 24,
		paddingVertical: 8,
		fontSize: 14,
		lineHeight: 20,
		fontStyle: 'italic'
	},
	section: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderTopWidth: StyleSheet.hairlineWidth
	},
	sectionTitle: {
		...sharedStyles.textMedium,
		paddingBottom: 8,
		fontSize: 12,
		lineHeight: 16,
		textTransform: 'uppercase'
	},
	row: {
		minHeight: 28,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12
	},
	label: {
		...sharedStyles.textRegular,
		fontSize: 14,
		lineHeight: 20
	},
	value: {
		...sharedStyles.textMedium,
		flexShrink: 1,
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'right'
	},
	qualityValue: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8
	},
	qualityDot: {
		width: QUALITY_DOT_SIZE,
		height: QUALITY_DOT_SIZE,
		borderRadius: QUALITY_DOT_SIZE / 2
	}
});

const CONNECTION_STATE_LABELS: Record<string, string> = {
	connected: 'Connection_state_connected',
	connecting: 'Connection_state_connecting',
	reconnecting: 'Connection_state_reconnecting',
	signalReconnecting: 'Connection_state_reconnecting',
	disconnected: 'Connection_state_disconnected'
};

const CONNECTION_QUALITY_LABELS: Record<string, string> = {
	excellent: 'Connection_quality_excellent',
	good: 'Connection_quality_good',
	poor: 'Connection_quality_poor',
	lost: 'Connection_quality_lost',
	unknown: 'Connection_quality_unknown'
};

const labelFor = (labels: Record<string, string>, key: string, fallbackKey: string): string => I18n.t(labels[key] ?? fallbackKey);

const qualityColor = (quality: string, colors: TColors): string => {
	switch (quality) {
		case 'excellent':
		case 'good':
			return colors.statusFontSuccess;
		case 'poor':
			return colors.statusFontWarning;
		case 'lost':
			return colors.fontDanger;
		default:
			return colors.fontHint;
	}
};

const formatBitrate = (kbps?: number): string => {
	if (kbps === undefined) {
		return NOT_AVAILABLE;
	}
	return kbps >= KBPS_PER_MBPS ? `${(kbps / KBPS_PER_MBPS).toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`;
};

const StatRow = ({ label, value, testID }: { label: string; value: string; testID?: string }): ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={styles.row} testID={testID}>
			<Text style={[styles.label, { color: colors.fontHint }]}>{label}</Text>
			<Text style={[styles.value, { color: colors.fontTitlesLabels }]}>{value}</Text>
		</View>
	);
};

const Section = ({ title, children }: { title: string; children: ReactElement | ReactElement[] }): ReactElement => {
	const { colors } = useTheme();
	return (
		<View style={[styles.section, { borderTopColor: colors.strokeLight }]}>
			<Text style={[styles.sectionTitle, { color: colors.fontHint }]}>{title}</Text>
			{children}
		</View>
	);
};

const ConnectionInfoSheetContent = (): ReactElement => {
	const { colors } = useTheme();
	const { hideActionSheet } = useActionSheet();
	const room = useConferenceRoomStore(state => state.room);
	const diagnostics = useConferenceDiagnostics(room);

	return (
		<View style={styles.container} testID='conference-connection-info-sheet'>
			<ConferenceSheetHeader title={I18n.t('Connection_info')} onClose={hideActionSheet} />
			{!diagnostics ? (
				<Text style={[styles.waiting, { color: colors.fontHint }]}>{I18n.t('Waiting_for_data')}</Text>
			) : (
				<ScrollView>
					<Section title={I18n.t('Connection')}>
						<StatRow
							label={I18n.t('Status')}
							value={labelFor(CONNECTION_STATE_LABELS, diagnostics.connectionState, 'Connection_state_disconnected')}
						/>
						<View style={styles.row}>
							<Text style={[styles.label, { color: colors.fontHint }]}>{I18n.t('Quality')}</Text>
							<View style={styles.qualityValue}>
								<View style={[styles.qualityDot, { backgroundColor: qualityColor(diagnostics.connectionQuality, colors) }]} />
								<Text style={[styles.value, { color: colors.fontTitlesLabels }]}>
									{labelFor(CONNECTION_QUALITY_LABELS, diagnostics.connectionQuality, 'Connection_quality_unknown')}
								</Text>
							</View>
						</View>
						<StatRow
							label={I18n.t('Latency')}
							value={diagnostics.roundTripTimeMs === undefined ? NOT_AVAILABLE : `${diagnostics.roundTripTimeMs} ms`}
						/>
					</Section>
					<Section title={I18n.t('Bandwidth')}>
						<StatRow label={I18n.t('Upload')} value={formatBitrate(diagnostics.uploadKbps)} />
						<StatRow label={I18n.t('Download')} value={formatBitrate(diagnostics.downloadKbps)} />
						<StatRow label={I18n.t('Total_sent')} value={prettyBytes(diagnostics.totalBytesSent)} />
						<StatRow label={I18n.t('Total_received')} value={prettyBytes(diagnostics.totalBytesReceived)} />
					</Section>
					<Section title={I18n.t('Video_sending')}>
						<StatRow
							label={I18n.t('Resolution')}
							value={
								diagnostics.sendWidth && diagnostics.sendHeight
									? `${diagnostics.sendWidth}x${diagnostics.sendHeight}`
									: NOT_AVAILABLE
							}
						/>
						<StatRow label={I18n.t('FPS')} value={diagnostics.sendFps === undefined ? NOT_AVAILABLE : `${diagnostics.sendFps}`} />
						<StatRow label={I18n.t('Limited_by')} value={diagnostics.limitedBy ?? I18n.t('None')} />
					</Section>
				</ScrollView>
			)}
		</View>
	);
};

export default ConnectionInfoSheetContent;
