import { createIconSetFromIcoMoon } from 'react-native-vector-icons';

import icoMoonConfig from './selection.json';

const CustomIcon = createIconSetFromIcoMoon(
	icoMoonConfig,
	'custom',
	'custom.ttf'
);

export { CustomIcon };
