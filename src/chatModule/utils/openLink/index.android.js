import { NativeModules } from "react-native";

const openLink = url => NativeModules.CustomTabsAndroid.openURL(url);

export default openLink;
