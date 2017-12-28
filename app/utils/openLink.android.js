import CustomTabsAndroid from '../nativeModules/CustomTabsAndroid';

const openLink = (url: string) => CustomTabsAndroid.openURL(url);

export default openLink;
