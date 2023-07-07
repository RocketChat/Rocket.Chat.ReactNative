import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { createRef, ForwardedRef, forwardRef, useContext } from 'react';

import { TIconsName } from '../CustomIcon';
import ActionSheet from './ActionSheet';

export type TActionSheetOptionsItem = {
	title: string;
	icon?: TIconsName;
	danger?: boolean;
	testID?: string;
	onPress: () => void;
	right?: () => React.ReactElement;
};

export type TActionSheetOptions = {
	options?: TActionSheetOptionsItem[];
	headerHeight?: number;
	customHeader?: React.ReactElement | null;
	hasCancel?: boolean;
	type?: string;
	children?: React.ReactElement | null;
	snaps?: (string | number)[];
	onClose?: () => void;
	enableContentPanningGesture?: boolean;
};
export interface IActionSheetProvider {
	showActionSheet: (item: TActionSheetOptions) => void;
	hideActionSheet: () => void;
}

const context = React.createContext<IActionSheetProvider>({
	showActionSheet: () => {},
	hideActionSheet: () => {}
});

export const useActionSheet = () => useContext(context);

const { Provider, Consumer } = context;

export const withActionSheet = (Component: React.ComponentType<any>): typeof Component => {
	const WithActionSheetComponent = forwardRef((props: typeof React.Component, ref: ForwardedRef<IActionSheetProvider>) => (
		<Consumer>{(contexts: IActionSheetProvider) => <Component {...props} {...contexts} ref={ref} />}</Consumer>
	));

	hoistNonReactStatics(WithActionSheetComponent, Component);
	return WithActionSheetComponent;
};

const actionSheetRef: React.Ref<IActionSheetProvider> = createRef();

export const ActionSheetProvider = React.memo(({ children }: { children: React.ReactElement | React.ReactElement[] }) => {
	const getContext = () => ({
		showActionSheet: (options: TActionSheetOptions) => {
			actionSheetRef.current?.showActionSheet(options);
		},
		hideActionSheet: () => {
			actionSheetRef.current?.hideActionSheet();
		}
	});

	return (
		<Provider value={getContext()}>
			<ActionSheet ref={actionSheetRef}>
				<>{children}</>
			</ActionSheet>
		</Provider>
	);
});

export const hideActionSheetRef = (): void => {
	actionSheetRef?.current?.hideActionSheet();
};
