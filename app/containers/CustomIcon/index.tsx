import React from 'react';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import { TextProps } from 'react-native';

import { mappedIcons } from './mappedIcons';

const icoMoonConfig = require('./selection.json');

export const IconSet = createIconSetFromIcoMoon(icoMoonConfig, 'custom', 'custom.ttf');

export type TIconsName = keyof typeof mappedIcons;

interface ICustomIcon extends TextProps {
	name: TIconsName;
}

const CustomIcon = ({ name, ...props }: ICustomIcon) => (
	// @ts-ignore TODO remove this after update @types/react-native to 0.65.0
	<IconSet name={name} {...props} />
);
export { CustomIcon };
