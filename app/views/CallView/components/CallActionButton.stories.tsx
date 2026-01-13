import React from 'react';
import { View, StyleSheet } from 'react-native';

import CallActionButton from './CallActionButton';
import { CALL_BACKGROUND_COLOR } from '../styles';

const styles = StyleSheet.create({
	container: {
		backgroundColor: CALL_BACKGROUND_COLOR,
		padding: 24,
		alignItems: 'center'
	},
	row: {
		flexDirection: 'row',
		gap: 16
	}
});

const Wrapper = ({ children }: { children: React.ReactNode }) => <View style={styles.container}>{children}</View>;

export default {
	title: 'CallActionButton',
	component: CallActionButton
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
		<CallActionButton icon='phone-end' label='End' onPress={() => {}} variant='danger' testID='call-action-button' />
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
			<CallActionButton icon='phone-end' label='End' onPress={() => {}} variant='danger' testID='end' />
			<CallActionButton icon='kebab' label='More' onPress={() => {}} testID='more' />
		</View>
	</Wrapper>
);
