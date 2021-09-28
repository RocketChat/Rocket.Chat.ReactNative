import { TouchableOpacity } from 'react-native';

import { isAndroid } from '../../utils/deviceInfo';
import Touch from '../../utils/touch';

// Taken from https://github.com/rgommezz/react-native-scroll-bottom-sheet#touchables
export const Button = isAndroid ? Touch : TouchableOpacity;
