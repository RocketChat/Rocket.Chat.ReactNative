import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CustomIcon } from '../../containers/CustomIcon';
import sharedStyles from '../Styles';
import { useTheme } from '../../theme';
import { IMessageFromServer } from '../../definitions';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginTop: 8,
		flexDirection: 'row',
		alignItems: 'center'
	},
	detailsContainer: {
		flex: 1,
		flexDirection: 'row'
	},
	detailContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8
	},
	detailText: {
		fontSize: 10,
		marginLeft: 2,
		...sharedStyles.textSemibold
	}
});

interface IDiscussionDetails {
	item: IMessageFromServer;
	date: string;
}

const DiscussionDetails = ({ item, date }: IDiscussionDetails): React.ReactElement => {
	const { colors } = useTheme();
	let count: string | number | undefined = item.dcount;
	if (count && count >= 1000) {
		count = '+999';
	}

	return (
		<View style={[styles.container]}>
			<View style={styles.detailsContainer}>
				<View style={styles.detailContainer}>
					<CustomIcon name={'discussions'} size={24} color={colors.fontSecondaryInfo} />
					<Text style={[styles.detailText, { color: colors.fontSecondaryInfo }]} numberOfLines={1}>
						{count}
					</Text>
				</View>

				<View style={styles.detailContainer}>
					<CustomIcon name={'clock'} size={24} color={colors.fontSecondaryInfo} />
					<Text style={[styles.detailText, { color: colors.fontSecondaryInfo }]} numberOfLines={1}>
						{date}
					</Text>
				</View>
			</View>
		</View>
	);
};

export default DiscussionDetails;
