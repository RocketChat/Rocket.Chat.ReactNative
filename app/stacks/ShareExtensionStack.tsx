import { useContext, type ComponentType } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { type StaticParamList, type StaticScreenProps } from '@react-navigation/native';

import { ThemeContext } from '../theme';
import { defaultHeader, themedHeader } from '../lib/methods/helpers/navigation';
import SelectServerView from '../views/SelectServerView';
import ShareListView from '../views/ShareListView';
import ShareView from '../views/ShareView';
import withNavigation from '../lib/navigation/withNavigation';
import { type IAttachment, type TServerModel, type TSubscriptionModel } from '../definitions';

type ShareViewParams = {
	attachments: IAttachment[];
	isShareView?: boolean;
	isShareExtension: boolean;
	serverInfo: TServerModel;
	text: string;
	room: TSubscriptionModel;
	thread?: any;
};

// Cast through `any` to break the type cycle that would arise from ShareListView/ShareView
// referencing ShareInsideStackParamList ← StaticParamList<typeof ShareExtension> ← these components.
const ShareListViewScreen: ComponentType<StaticScreenProps<undefined>> = withNavigation(ShareListView as any) as any;
const ShareViewScreen: ComponentType<StaticScreenProps<ShareViewParams>> = withNavigation(ShareView as any) as any;

const ShareExtension = createNativeStackNavigator({
	screenOptions: defaultHeader,
	screens: {
		ShareListView: ShareListViewScreen,
		ShareView: ShareViewScreen,
		SelectServerView
	}
}).with(({ Navigator }) => {
	'use memo';

	const { theme } = useContext(ThemeContext);
	return <Navigator screenOptions={themedHeader(theme)} />;
});

export type ShareInsideStackParamList = StaticParamList<typeof ShareExtension>;

export default ShareExtension;
