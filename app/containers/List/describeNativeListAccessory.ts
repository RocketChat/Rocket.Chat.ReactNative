import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Text, View, type SwitchProps } from 'react-native';

import { type TUserStatus } from '~/definitions';
import { CustomIcon, type TIconsName } from '../CustomIcon';
import NewWindowIcon from '../NewWindowIcon';
import Radio from '../Radio';
import Status from '../Status/Status';
import Switch from '../Switch';
import ListCheckbox, { type IListCheckbox } from './ListCheckbox';
import ListIcon from './ListIcon';

export type TNativeListAccessory =
	| { kind: 'icon'; name: TIconsName; color?: string; size?: number }
	| { kind: 'check' }
	| { kind: 'status'; status: TUserStatus }
	| { kind: 'toggle'; isOn: boolean; onValueChange?: (value: boolean) => void; disabled: boolean; testID?: string }
	| { kind: 'checkbox'; value: boolean; onValueChange: (value: boolean) => void; testID?: string }
	| { kind: 'text'; text: string }
	| { kind: 'hosted'; element: ReactElement };

interface IIconProps {
	name: TIconsName;
	color?: string;
	size?: number;
}

const iconAccessory = (name: TIconsName, { color, size }: Partial<IIconProps>): TNativeListAccessory => ({
	kind: 'icon',
	name,
	color: color || undefined,
	size
});

const textContent = (children: ReactNode) => {
	const parts = Children.toArray(children);
	return parts.every(part => typeof part === 'string' || typeof part === 'number') ? parts.join('') : null;
};

const onlyChild = (children: ReactNode) => {
	const parts = Children.toArray(children);
	return parts.length === 1 && isValidElement(parts[0]) ? parts[0] : null;
};

type TProps = Record<string, any>;
type TDescriber = (props: TProps) => TNativeListAccessory | null | undefined;

const describeText: TDescriber = ({ children }) => {
	const text = textContent(children);
	return text === null ? undefined : { kind: 'text', text };
};

const describeToggle: TDescriber = props => {
	const { value, onValueChange, disabled, testID } = props as SwitchProps;
	return { kind: 'toggle', isOn: Boolean(value), onValueChange: onValueChange ?? undefined, disabled: Boolean(disabled), testID };
};

const describeCheckbox: TDescriber = props => {
	const { value, onValueChange, testID } = props as IListCheckbox;
	return { kind: 'checkbox', value, onValueChange, testID };
};

const describeWrapper: TDescriber = ({ children }) => {
	const child = onlyChild(children);
	const described = child ? describeNativeListAccessory(child) : null;
	return described?.kind === 'hosted' ? undefined : described;
};

const describers = new Map<unknown, TDescriber>([
	[ListCheckbox, describeCheckbox],
	[ListIcon, props => iconAccessory(props.name, props)],
	[CustomIcon, props => iconAccessory(props.name, props)],
	[NewWindowIcon, props => iconAccessory('new-window', props)],
	[Radio, ({ check }) => (check ? { kind: 'check' } : null)],
	[Status, ({ status }) => ({ kind: 'status', status: status ?? 'offline' })],
	[Switch, describeToggle],
	[Text, describeText],
	[View, describeWrapper]
]);

export function describeNativeListAccessory(node: ReactNode): TNativeListAccessory | null {
	if (!isValidElement<TProps>(node)) {
		return null;
	}
	const described = describers.get(node.type)?.(node.props);
	return described === undefined ? { kind: 'hosted', element: node } : described;
}
