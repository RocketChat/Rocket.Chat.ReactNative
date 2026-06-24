import { View } from 'react-native';
import { type ReactElement } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import { Header } from '../../../containers/List';

const styles = StyleSheet.create((_theme, rt) => ({
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
	},
	statusSize: {
		width: 10 * rt.fontScale,
		height: 10 * rt.fontScale,
		borderRadius: 5 * rt.fontScale
	}
}));

interface ICustomListSection {
	children: (ReactElement | null)[] | ReactElement | null;
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
		{statusColor ? <View style={[styles.statusContainer, { backgroundColor: statusColor }, styles.statusSize]} /> : null}
	</View>
);

const CustomListSection = ({ children, title, translateTitle, statusColor }: ICustomListSection) => (
	<View style={styles.container}>
		{title ? <CustomHeader {...{ title, translateTitle, statusColor }} /> : null}
		{children}
	</View>
);

export default CustomListSection;
