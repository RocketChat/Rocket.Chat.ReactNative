import React from 'react';
import { View, Text } from 'react-native';
import NoDataFound from '../containers/NoDataFound';
import SafeAreaView from '../containers/SafeAreaView';
import StatusBar from '../containers/StatusBar';
import { useTheme } from '../theme';

const TeamChannelsView = () => {
	const { theme } = useTheme();

	return (
		<SafeAreaView testID='team-channels-view'>
			<StatusBar />
			<NoDataFound text='123' />
		</SafeAreaView>
	);
};

export default TeamChannelsView;
