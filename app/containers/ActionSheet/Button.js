import { TouchableOpacity } from 'react-native';

import { isAndroid } from '../../utils/deviceInfo';
import Touch from '../../utils/touch';

// For some reason react-native-gesture-handler isn't working on bottom sheet (iOS)
const Button = isAndroid ? Touch : TouchableOpacity;
export default Button;
