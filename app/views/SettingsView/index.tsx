import React, { useLayoutEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as HeaderButton from '../../containers/Header/components/HeaderButton';
import * as List from '../../containers/List';
import SafeAreaView from '../../containers/SafeAreaView';
import I18n from '../../i18n';
import { useAppSelector } from '../../lib/hooks/useAppSelector';
import { events, logEvent } from '../../lib/methods/helpers/log';
import { SettingsStackParamList } from '../../stacks/types';

const SettingsView = (): React.ReactElement => {
        const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'SettingsView'>>();
        const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

        useLayoutEffect(() => {
                navigation.setOptions({
                        headerLeft: () =>
                                isMasterDetail ? (
                                        <HeaderButton.CloseModal navigation={navigation} testID='settings-view-close' />
                                ) : (
                                        <HeaderButton.Drawer navigation={navigation} testID='settings-view-drawer' />
                                ),
                        title: I18n.t('Settings')
                });
        }, [navigation, isMasterDetail]);

        const navigateToScreen = (screen: keyof SettingsStackParamList) => {
                const screenName = `SE_GO_${screen.replace('View', '').toUpperCase()}` as keyof typeof events;
                const eventName = events[screenName];
                if (eventName) {
                        logEvent(eventName);
                }
                navigation.navigate(screen);
        };

        return (
                <SafeAreaView testID='settings-view'>
                        <List.Container>
                                <List.Section>
                                        <List.Separator />
                                        <List.Item
                                                title='Language'
                                                onPress={() => navigateToScreen('LanguageView')}
                                                showActionIndicator
                                                testID='settings-view-language'
                                                left={() => <List.Icon name='language' />}
                                        />
                                        <List.Separator />
                                        <List.Item
                                                title='Default_browser'
                                                showActionIndicator
                                                onPress={() => navigateToScreen('DefaultBrowserView')}
                                                testID='settings-view-default-browser'
                                                left={() => <List.Icon name='federation' />}
                                        />
                                        <List.Separator />
                                        <List.Item
                                                title='Media_auto_download'
                                                showActionIndicator
                                                onPress={() => navigateToScreen('MediaAutoDownloadView')}
                                                testID='settings-view-media-auto-download'
                                                left={() => <List.Icon name='download' />}
                                        />
                                        <List.Separator />
                                        <List.Item
                                                title='Security_and_privacy'
                                                showActionIndicator
                                                onPress={() => navigateToScreen('SecurityPrivacyView')}
                                                testID='settings-view-security-privacy'
                                                left={() => <List.Icon name='locker' />}
                                        />
                                        <List.Separator />
                                </List.Section>
                        </List.Container>
                </SafeAreaView>
        );
};

export default SettingsView;
