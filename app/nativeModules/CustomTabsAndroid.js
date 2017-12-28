/**
 * This exposes the native CustomTabsAndroid module as a JS module. This has a
 * function 'openURL' which takes the following parameters:
 *
 * 1. String url: A url to be opened in customTabs
 */
import { NativeModules } from 'react-native';

module.exports = NativeModules.CustomTabsAndroid;
