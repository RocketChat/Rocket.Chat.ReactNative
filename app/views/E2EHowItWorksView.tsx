import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import * as HeaderButton from '../containers/HeaderButton';
import Markdown from '../containers/markdown';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { E2ESaveYourPasswordStackParamList } from '../stacks/types';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
	},
	info: {
		fontSize: 16,
		marginBottom: 16
	}
});

const E2EHowItWorksView = (): React.ReactElement => {
	const { setOptions } = useNavigation();
	const { colors } = useTheme();
	const { params } = useRoute<RouteProp<E2ESaveYourPasswordStackParamList, 'E2EHowItWorksView'>>();

	useEffect(() => {
		setOptions({
			title: I18n.t('How_It_Works'),
			headerLeft: params?.showCloseModal ? () => <HeaderButton.CloseModal /> : undefined
		});
	}, []);

	const infoStyle = [styles.info, { color: colors.fontDefault }];

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceRoom }]} testID='e2e-how-it-works-view'>
			<Markdown msg={I18n.t('E2E_How_It_Works_info1')} style={infoStyle} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info2')} style={infoStyle} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info3')} style={infoStyle} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info4')} style={infoStyle} />
		</SafeAreaView>
	);
};

export default E2EHowItWorksView;
