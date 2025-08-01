import { memo, ReactElement } from 'react';

import SafeAreaView from '../../../containers/SafeAreaView';
import StatusBar from '../../../containers/StatusBar';
import { useTheme } from '../../../theme';
import TabletHeader from './TabletHeader';

const Container = ({ children }: { children: ReactElement }) => {
	const { colors } = useTheme();
	return (
		<SafeAreaView testID='rooms-list-view' style={{ backgroundColor: colors.surfaceRoom }}>
			<TabletHeader />
			{children}
		</SafeAreaView>
	);
};

export default memo(Container);
