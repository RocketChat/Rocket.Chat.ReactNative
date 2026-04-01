import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';

import { Container } from './Container';

const styles = StyleSheet.create({
	root: {
		flex: 1
	},
	placeholder: {
		marginTop: 8,
		padding: 12,
		borderRadius: 6,
		backgroundColor: '#efefef'
	}
});

const PlaceholderChildren = () => (
	<View style={styles.placeholder}>
		<Text>Mock children placeholder</Text>
	</View>
);

const BottomSheetWrapper = ({ children }: { children: React.ReactNode }) => (
	<View style={styles.root}>
		<BottomSheet
			index={0}
			snapPoints={['95%']}
			handleComponent={null}
			enablePanDownToClose={false}
			backgroundStyle={{ backgroundColor: 'transparent' }}>
			<View style={styles.root}>{children}</View>
		</BottomSheet>
	</View>
);

export default {
	title: 'NewMediaCall/Container',
	component: Container,
	decorators: [
		(Story: React.ComponentType) => (
			<BottomSheetWrapper>
				<Story />
			</BottomSheetWrapper>
		)
	]
};

export const Default = () => (
	<Container>
		<PlaceholderChildren />
	</Container>
);
