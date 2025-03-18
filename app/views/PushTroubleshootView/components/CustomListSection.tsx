import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

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
}) => {
	const { fontScale } = useWindowDimensions();
	const statusSize = {
		width: 10 * fontScale,
		height: 10 * fontScale,
		borderRadius: 5 * fontScale
	};
	return (
		<View style={styles.headerContainer}>
			<Header {...{ title, translateTitle }} />
			{statusColor ? <View style={[styles.statusContainer, { backgroundColor: statusColor }, statusSize]} /> : null}
		</View>
	);
};

const CustomListSection = ({ children, title, translateTitle, statusColor }: ICustomListSection) => (
	<View style={styles.container}>
		{title ? <CustomHeader {...{ title, translateTitle, statusColor }} /> : null}
		{children}
	</View>
);

export default CustomListSection;
