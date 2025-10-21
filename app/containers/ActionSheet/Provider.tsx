import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { createRef, type ForwardedRef, forwardRef, useContext } from 'react';
import { type AccessibilityRole } from 'react-native';


import { type TIconsName } from '../CustomIcon';
import ActionSheet from './ActionSheet';

export type TActionSheetOptionsItem = {
	title: string;
	subtitle?: string;
	accessibilityLabel?: string;
	icon?: TIconsName;
	danger?: boolean;
	testID?: string;
	onPress: () => void;
	right?: () => React.ReactElement;
	enabled?: boolean;
	accessibilityRole?: AccessibilityRole;
};

export type TActionSheetOptions = {
	options?: TActionSheetOptionsItem[];
	headerHeight?: number;
	customHeader?: React.ReactElement | null;
	hasCancel?: boolean;
	// children can both use snaps or dynamic
	children?: React.ReactElement | null;
	/** Required if your action sheet needs vertical scroll */
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

	hoistNonReactStatics(WithActionSheetComponent as any, Component as any);
	return WithActionSheetComponent;
};

const actionSheetRef: React.Ref<IActionSheetProvider> = createRef();

export const ActionSheetProvider = React.memo(({ children }: { children: React.ReactElement | React.ReactElement[] }) => {
	'use memo';

	const getContext = (): IActionSheetProvider => ({
		showActionSheet: options => {
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

export const showActionSheetRef: IActionSheetProvider['showActionSheet'] = options => {
	actionSheetRef?.current?.showActionSheet(options);
};

export const hideActionSheetRef: IActionSheetProvider['hideActionSheet'] = () => {
	actionSheetRef?.current?.hideActionSheet();
};
