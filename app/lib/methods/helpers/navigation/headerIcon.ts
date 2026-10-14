import type { ColorValue } from 'react-native';

import { iconAssetName, type TIconsName } from '~/containers/CustomIcon';

export const headerIcon = (name: TIconsName) => ({ type: 'xcasset' as const, name: iconAssetName(name) });

export const headerTextIcon = (name: TIconsName, tintColor: ColorValue) => ({ ...headerIcon(name), tintColor });
