import { memo, ReactElement } from 'react';
import { StatusBar } from 'react-native';

import SafeAreaView from '../../../containers/SafeAreaView';
import { useTheme } from '../../../theme';
import TabletHeader from './TabletHeader';

const Container = ({ children }: { children: ReactElement }) => {
	const { colors } = useTheme();
	return (
		<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: colors.surfaceRoom }}>
			<StatusBar />
			<TabletHeader />
			{children}
		</SafeAreaView>
	);
};

export default memo(Container);
