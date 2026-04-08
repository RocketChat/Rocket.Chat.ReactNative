import React from 'react';
import { View, StyleSheet } from 'react-native';

import CallActionButton from './CallActionButton';
import {
	BASE_ROW_HEIGHT,
	BASE_ROW_HEIGHT_CONDENSED,
	FONT_SCALE_LIMIT,
	ResponsiveLayoutContext
} from '../../../lib/hooks/useResponsiveLayout/useResponsiveLayout';

const styles = StyleSheet.create({
	container: {
		padding: 24,
		alignItems: 'center'
	},
	row: {
		flexDirection: 'row',
		gap: 16
	},
	tabletRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 48
	}
});

const responsiveLayoutProviderLargeFontValue = (fontScale: number) => {
	const isLargeFontScale = fontScale > FONT_SCALE_LIMIT;
	const fontScaleLimited = isLargeFontScale ? FONT_SCALE_LIMIT : fontScale;

	return {
		fontScale,
		fontScaleLimited,
		isLargeFontScale,
		rowHeight: BASE_ROW_HEIGHT * fontScale,
		rowHeightCondensed: BASE_ROW_HEIGHT_CONDENSED * fontScale,
		width: 350,
		height: 800
	};
};

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'CallView/CallActionButton',
	component: CallActionButton,
	decorators: [
		(Story: React.ComponentType) => (
			<ResponsiveLayoutContext.Provider value={responsiveLayoutProviderLargeFontValue(1)}>
				<Wrapper>
					<Story />
				</Wrapper>
			</ResponsiveLayoutContext.Provider>
		)
	]
};

export const DefaultButton = () => (
	<Wrapper>
		<CallActionButton icon='microphone' label='Mute' onPress={() => {}} testID='call-action-button' />
	</Wrapper>
);

export const ActiveButton = () => (
	<Wrapper>
		<CallActionButton icon='microphone-disabled' label='Unmute' onPress={() => {}} variant='active' testID='call-action-button' />
	</Wrapper>
);

export const DangerButton = () => (
	<Wrapper>
		<CallActionButton icon='phone-off' label='End' onPress={() => {}} variant='danger' testID='call-action-button' />
	</Wrapper>
);

export const DisabledButton = () => (
	<Wrapper>
		<CallActionButton icon='pause' label='Hold' onPress={() => {}} disabled testID='call-action-button' />
	</Wrapper>
);

export const AllVariants = () => (
	<Wrapper>
		<View style={styles.row}>
			<CallActionButton icon='audio' label='Speaker' onPress={() => {}} testID='speaker' />
			<CallActionButton icon='pause' label='Hold' onPress={() => {}} testID='hold' />
			<CallActionButton icon='microphone' label='Mute' onPress={() => {}} testID='mute' />
		</View>
		<View style={[styles.row, { marginTop: 24 }]}>
			<CallActionButton icon='message' label='Message' onPress={() => {}} testID='message' />
			<CallActionButton icon='phone-off' label='End' onPress={() => {}} variant='danger' testID='end' />
			<CallActionButton icon='kebab' label='More' onPress={() => {}} testID='more' />
		</View>
	</Wrapper>
);

// Tablet / wide layout: all action buttons in a single row, mirroring
// CallButtons rendering when layoutMode='wide'.
export const TabletAllVariants = () => (
	<Wrapper>
		<View style={styles.tabletRow}>
			<CallActionButton icon='audio' label='Speaker' onPress={() => {}} testID='speaker' />
			<CallActionButton icon='pause-shape-unfilled' label='Hold' onPress={() => {}} testID='hold' />
			<CallActionButton icon='microphone' label='Mute' onPress={() => {}} testID='mute' />
			<CallActionButton icon='message' label='Message' onPress={() => {}} testID='message' />
			<CallActionButton icon='phone-off' label='End' onPress={() => {}} variant='danger' testID='end' />
			<CallActionButton icon='dialpad' label='Dialpad' onPress={() => {}} testID='dialpad' />
		</View>
	</Wrapper>
);
