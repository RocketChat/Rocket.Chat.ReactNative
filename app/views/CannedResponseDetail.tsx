import { useEffect } from 'react';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Text, View, ScrollView } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import I18n from '../i18n';
import SafeAreaView from '../containers/SafeAreaView';
import Button from '../containers/Button';
import { goRoom } from '../lib/methods/helpers/goRoom';
import Markdown from '../containers/markdown';
import { type ICannedResponse } from '../definitions/ICannedResponse';
import { type ChatsStackParamList } from '../stacks/types';
import sharedStyles from './Styles';
import { useMasterDetail } from '../lib/hooks/useMasterDetail';

const styles = StyleSheet.create(theme => ({
	scroll: {
		flex: 1,
		backgroundColor: theme.colors.surfaceTint
	},
	container: {
		flex: 1,
		marginTop: 12,
		marginHorizontal: 15
	},
	cannedText: {
		marginTop: 8,
		marginBottom: 16,
		fontSize: 14,
		paddingTop: 0,
		paddingBottom: 0,
		...sharedStyles.textRegular,
		color: theme.colors.fontHint
	},
	cannedTagWrap: {
		borderRadius: 4,
		marginRight: 4,
		marginTop: 8,
		height: 16,
		backgroundColor: theme.colors.strokeExtraLight
	},
	cannedTagContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},
	cannedTag: {
		fontSize: 12,
		paddingTop: 0,
		paddingBottom: 0,
		paddingHorizontal: 4,
		...sharedStyles.textRegular,
		color: theme.colors.fontHint
	},
	button: {
		margin: 24,
		marginBottom: 24
	},
	item: {
		paddingVertical: 10,
		justifyContent: 'center'
	},
	itemLabel: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textMedium,
		color: theme.colors.fontTitlesLabels
	}
}));

interface IItem {
	label: string;
	content?: string;
	testID?: string;
}

const Item = ({ label, content, testID }: IItem) =>
	content ? (
		<View style={styles.item} testID={testID}>
			<Text accessibilityLabel={label} style={styles.itemLabel}>
				{label}
			</Text>
			<Markdown msg={content} />
		</View>
	) : null;

const CannedResponseDetail = () => {
	const navigation = useNavigation<NativeStackNavigationProp<ChatsStackParamList, 'CannedResponseDetail'>>();
	const route = useRoute<RouteProp<ChatsStackParamList, 'CannedResponseDetail'>>();

	const { cannedResponse } = route?.params;
	const isMasterDetail = useMasterDetail();

	useEffect(() => {
		navigation.setOptions({
			title: `!${cannedResponse?.shortcut}`
		});
	}, [navigation, cannedResponse?.shortcut]);

	const navigateToRoom = (item: ICannedResponse) => {
		const { room } = route.params;

		if (room.rid) {
			goRoom({ item: room, isMasterDetail, usedCannedResponse: item.text });
		}
	};

	return (
		<SafeAreaView>
			<ScrollView contentContainerStyle={styles.scroll}>
				<View style={styles.container}>
					<Item label={I18n.t('Shortcut')} content={`!${cannedResponse?.shortcut}`} />
					<Item label={I18n.t('Content')} content={cannedResponse?.text} />
					<Item label={I18n.t('Sharing')} content={cannedResponse?.scopeName} />

					<View style={styles.item}>
						<Text style={styles.itemLabel}>{I18n.t('Tags')}</Text>
						<View style={styles.cannedTagContainer}>
							{cannedResponse?.tags?.length > 0 ? (
								cannedResponse.tags.map(t => (
									<View style={styles.cannedTagWrap}>
										<Text style={styles.cannedTag}>{t}</Text>
									</View>
								))
							) : (
								<Text style={styles.cannedText}>-</Text>
							)}
						</View>
					</View>
				</View>
				<Button title={I18n.t('Use')} style={styles.button} type='primary' onPress={() => navigateToRoom(cannedResponse)} />
			</ScrollView>
		</SafeAreaView>
	);
};

export default CannedResponseDetail;
