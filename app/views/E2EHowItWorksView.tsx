import { useEffect, type ReactElement } from 'react';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StyleSheet } from 'react-native-unistyles';

import * as HeaderButton from '../containers/Header/components/HeaderButton';
import Markdown from '../containers/markdown';
import SafeAreaView from '../containers/SafeAreaView';
import I18n from '../i18n';
import { type E2ESaveYourPasswordStackParamList } from '../stacks/types';

const styles = StyleSheet.create(theme => ({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: theme.colors.surfaceRoom
	}
}));

const E2EHowItWorksView = (): ReactElement => {
	const { setOptions } = useNavigation();
	const { params } = useRoute<RouteProp<E2ESaveYourPasswordStackParamList, 'E2EHowItWorksView'>>();

	useEffect(() => {
		setOptions({
			title: I18n.t('How_It_Works'),
			headerLeft: params?.showCloseModal ? () => <HeaderButton.CloseModal /> : undefined
		});
	}, []);

	return (
		<SafeAreaView style={styles.container} testID='e2e-how-it-works-view'>
			<Markdown msg={I18n.t('E2E_How_It_Works_info1')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info2')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info3')} />
			<Markdown msg={I18n.t('E2E_How_It_Works_info4')} />
		</SafeAreaView>
	);
};

export default E2EHowItWorksView;
