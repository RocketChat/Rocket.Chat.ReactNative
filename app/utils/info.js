import { Alert } from 'react-native';
import Toast from '@remobile/react-native-toast';

export const showToast = (message: string) => Toast.showLongCenter(message, Toast.SHORT);

export const showErrorAlert = (message: string, title: string) => Alert.alert(title, message, [{ text: 'OK', onPress: () => {} }], { cancelable: true });
