import React from 'react';
import { View, StyleSheet } from 'react-native';

import { SwitchItem } from './SwitchItem';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'flex-start',
		padding: 16
	}
});

export default {
	title: 'SwitchItem'
};

const testSwitch = {
	id: 'switch-id',
	hint: 'Read_only_hint',
	label: 'Onboarding_title',
	onValueChange: () => {},
	value: false,
	testSwitchID: 'create-channel-switch-id',
	testLabelID: 'create-channel-switch-id-hint'
};

export const Switch = () => (
	<>
		<View style={styles.container}>
			<SwitchItem
				hint={testSwitch.hint}
				id={testSwitch.id}
				label={testSwitch.label}
				onValueChange={() => testSwitch.onValueChange()}
				value={testSwitch.value}
			/>
		</View>
	</>
);
