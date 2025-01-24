import React, { useEffect } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import I18n from '../i18n';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import Button from '../containers/Button';
import { TSupportedThemes, useTheme } from '../theme';
import { goRoom } from '../lib/methods/helpers/goRoom';
import { themes } from '../lib/constants';
import Markdown from '../containers/markdown';
import { ICannedResponse } from '../definitions/ICannedResponse';
import { ChatsStackParamList } from '../stacks/types';
import sharedStyles from './Styles';
import { useAppSelector } from '../lib/hooks';

const styles = StyleSheet.create({
	scroll: {
		flex: 1
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
		...sharedStyles.textRegular
	},
	cannedTagWrap: {
		borderRadius: 4,
		marginRight: 4,
		marginTop: 8,
		height: 16
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
		...sharedStyles.textRegular
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
		...sharedStyles.textMedium
	},
	itemContent: {
		fontSize: 14,
		...sharedStyles.textRegular
	}
});

interface IItem {
	label: string;
	content?: string;
	theme: TSupportedThemes;
	testID?: string;
}

const Item = ({ label, content, theme, testID }: IItem) =>
	content ? (
		<View style={styles.item} testID={testID}>
			<Text accessibilityLabel={label} style={[styles.itemLabel, { color: themes[theme].fontTitlesLabels }]}>
				{label}
			</Text>
			<Markdown style={[styles.itemContent, { color: themes[theme].fontSecondaryInfo }]} msg={content} />
		</View>
	) : null;

interface ICannedResponseDetailProps {
	navigation: NativeStackNavigationProp<ChatsStackParamList, 'CannedResponseDetail'>;
	route: RouteProp<ChatsStackParamList, 'CannedResponseDetail'>;
}

const CannedResponseDetail = ({ navigation, route }: ICannedResponseDetailProps): JSX.Element => {
	const { cannedResponse } = route?.params;
	const { theme } = useTheme();
	const { isMasterDetail } = useAppSelector(state => state.app);

	useEffect(() => {
		navigation.setOptions({
			title: `!${cannedResponse?.shortcut}`
		});
	}, []);

	const navigateToRoom = (item: ICannedResponse) => {
		const { room } = route.params;

		if (room.rid) {
			goRoom({ item: room, isMasterDetail, popToRoot: true, usedCannedResponse: item.text });
		}
	};

	return (
		<SafeAreaView>
			<ScrollView contentContainerStyle={[styles.scroll, { backgroundColor: themes[theme].surfaceTint }]}>
				<StatusBar />
				<View style={styles.container}>
					<Item label={I18n.t('Shortcut')} content={`!${cannedResponse?.shortcut}`} theme={theme} />
					<Item label={I18n.t('Content')} content={cannedResponse?.text} theme={theme} />
					<Item label={I18n.t('Sharing')} content={cannedResponse?.scopeName} theme={theme} />

					<View style={styles.item}>
						<Text style={[styles.itemLabel, { color: themes[theme].fontTitlesLabels }]}>{I18n.t('Tags')}</Text>
						<View style={styles.cannedTagContainer}>
							{cannedResponse?.tags?.length > 0 ? (
								cannedResponse.tags.map(t => (
									<View style={[styles.cannedTagWrap, { backgroundColor: themes[theme].strokeExtraLight }]}>
										<Text style={[styles.cannedTag, { color: themes[theme].fontHint }]}>{t}</Text>
									</View>
								))
							) : (
								<Text style={[styles.cannedText, { color: themes[theme].fontHint }]}>-</Text>
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
