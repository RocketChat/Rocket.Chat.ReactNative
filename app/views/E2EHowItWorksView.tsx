import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import * as HeaderButton from '../containers/Header/components/HeaderButton';
import Markdown from '../containers/markdown';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { E2ESaveYourPasswordStackParamList } from '../stacks/types';
import { useTheme } from '../theme';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16
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

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceRoom }]} testID='e2e-how-it-works-view'>
			<Markdown msg={I18n.t('E2E_How_It_Works_info1')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info2')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info3')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info4')} />
		</SafeAreaView>
	);
};

export default E2EHowItWorksView;
