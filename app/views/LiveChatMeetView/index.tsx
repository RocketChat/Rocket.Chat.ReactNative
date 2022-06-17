import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { WebView } from 'react-native-webview';

import SafeAreaView from '../../containers/SafeAreaView';
import StatusBar from '../../containers/StatusBar';
import I18n from '../../i18n';
import { InsideStackParamList } from '../../stacks/types';

const LiveChatMeetView = (): React.ReactElement => {
	const navigation = useNavigation<StackNavigationProp<InsideStackParamList, 'LiveChatMeetView'>>();
	const route = useRoute<RouteProp<InsideStackParamList, 'LiveChatMeetView'>>();

	useEffect(() => {
		navigation.setOptions({
			title: I18n.t('Video_call')
		});
	}, [navigation]);

	const { url } = route.params;

	return (
		<SafeAreaView>
			<StatusBar />
			<WebView source={{ uri: url }} />
		</SafeAreaView>
	);
};

export default LiveChatMeetView;
