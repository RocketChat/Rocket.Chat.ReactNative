import CustomTabsAndroid from '../../nativeModules/CustomTabsAndroid';

const openLink = url => CustomTabsAndroid.openURL(url);

export default openLink;
