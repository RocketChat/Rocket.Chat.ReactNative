import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Header } from '../../../containers/List';

const styles = StyleSheet.create({
	container: {
		marginBottom: 16
	},
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	statusContainer: {
		width: 10,
		height: 10,
		borderRadius: 5,
		marginRight: 12
	}
});

interface ICustomListSection {
	children: (React.ReactElement | null)[] | React.ReactElement | null;
	title: string;
	translateTitle?: boolean;
	statusColor?: string;
}

const CustomHeader = ({
	title,
	translateTitle,
	statusColor
}: {
	title: string;
	translateTitle?: boolean;
	statusColor?: string;
}) => (
	<View style={styles.headerContainer}>
		<Header {...{ title, translateTitle }} />
		{statusColor ? <View style={[styles.statusContainer, { backgroundColor: statusColor }]} /> : null}
	</View>
);

const CustomListSection = ({ children, title, translateTitle, statusColor }: ICustomListSection) => (
	<View style={styles.container}>
		{title ? <CustomHeader {...{ title, translateTitle, statusColor }} /> : null}
		{children}
	</View>
);

export default CustomListSection;
