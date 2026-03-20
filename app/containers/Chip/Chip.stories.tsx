import React from 'react';
import { StyleSheet, View } from 'react-native';

import Chip, { type IChip } from './index';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'flex-start',
		padding: 16
	}
});

export default {
	title: 'Chip'
};

const ChipWrapped = ({ avatar, text, onPress, testID, style, fullWidth }: IChip) => (
	<View style={styles.container}>
		<Chip avatar={avatar} text={text} onPress={onPress} testID={testID} style={style} fullWidth={fullWidth} />
	</View>
);

export const ChipText = () => <ChipWrapped avatar='rocket.cat' text={'Rocket.Cat'} onPress={() => {}} />;

export const ChipWithShortText = () => <ChipWrapped avatar='rocket.cat' text={'Short'} onPress={() => {}} />;

export const ChipWithoutAvatar = () => <ChipWrapped text={'Without Avatar'} onPress={() => {}} />;

export const ChipWithoutIcon = () => <ChipWrapped avatar='rocket.cat' text='Without Icon' />;

export const ChipWithoutAvatarAndIcon = () => <ChipWrapped text='Without Avatar and Icon' />;

export const ChipFullWidth = () => <ChipWrapped text='Full Width Text With Long Text That Should Be Wrapped' fullWidth />;
