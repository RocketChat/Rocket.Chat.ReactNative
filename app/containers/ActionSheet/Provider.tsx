import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { ForwardedRef, forwardRef, useContext, useRef } from 'react';

import { TIconsName } from '../CustomIcon';
import ActionSheet from './ActionSheet';

export type TActionSheetOptionsItem = {
	title: string;
	icon: TIconsName;
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
	snaps?: string[] | number[];
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

export const ActionSheetProvider = React.memo(({ children }: { children: React.ReactElement | React.ReactElement[] }) => {
	const ref: ForwardedRef<IActionSheetProvider> = useRef(null);

	const getContext = () => ({
		showActionSheet: (options: TActionSheetOptions) => {
			ref.current?.showActionSheet(options);
		},
		hideActionSheet: () => {
			ref.current?.hideActionSheet();
		}
	});

	return (
		<Provider value={getContext()}>
			<ActionSheet ref={ref}>
				<>{children}</>
			</ActionSheet>
		</Provider>
	);
});
