import RNConfigReader from 'react-native-config-reader';

// Checks for undefined values
let fDroidBuild = RNConfigReader.FDROID_BUILD || false;
let officialBuild = RNConfigReader.OFFICIAL_BUILD || false;

export const isOfficialBuild = officialBuild;
export const isFDroidBuild = fDroidBuild;
