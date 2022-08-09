import { TouchableOpacity } from 'react-native';

import { isAndroid } from '../../lib/methods/helpers';
import Touch from '../Touch';

// Taken from https://github.com/rgommezz/react-native-scroll-bottom-sheet#touchables
export const Button = isAndroid ? Touch : TouchableOpacity;
