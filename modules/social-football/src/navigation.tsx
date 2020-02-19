import React, { forwardRef, useEffect, useState } from 'react';
import { createAppContainer, createNavigator, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { useQuery } from '@apollo/react-hooks';
import { IS_AUTHENTICATED } from './api/queries/authentication.queries';
import { TokenPayload } from './security/models/token-payload';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import SecurityManager from './security/security-manager';
import i18n from './i18n';

export const UnaunthenticatedNavigation: any = createAppContainer(createStackNavigator(
    {
        LoginPage: {
            getScreen: () => require('./pages/LoginPage').default
        },
        RegisterPage: {
            getScreen: () => require('./pages/RegisterPage').default
        }
    },
    {
        initialRouteName: 'LoginPage',
        headerMode: 'none',
    }
));

export const AuthenticatedNavigation: any = createAppContainer(createStackNavigator(
    {
        TimelinePage: {
            //title: 'Tijdlijn',
            // options: {
            //     title: 'tststst',
            // },
            getScreen: () => require('./pages/TimelinePage').default
        },
        CreateThreadPage: {
            //title: i18n.t('createThread.title'),
            getScreen: () => require('./pages/CreateThreadPage').default,
            
            // header: ({ scene, previous, navigation }) => {
            //     const { options } = scene.descriptor;
            //     const title =
            //     options.headerTitle !== undefined
            //         ? options.headerTitle
            //         : options.title !== undefined
            //         ? options.title
            //         : scene.route.name;
            
            //     return (
            //     <Text>test</Text>
            //     );
            // }
        }
    },
    {
        initialRouteName: 'TimelinePage',
    }
));

const styles = StyleSheet.create({
    activityHolder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    }
});

export const Navigation = forwardRef((props, ref) => {
    const { data, client } = useQuery<{ getUser: TokenPayload }>(IS_AUTHENTICATED);
    const [login, setLogin] = useState(null);

    useEffect(() => {
        SecurityManager.login$.subscribe(value => {
            setLogin(value);
        });
    }, []);

    return <>
        {login === null ? <View style={[styles.activityHolder]}><ActivityIndicator /></View> : (
                (login === false)
            ?
                <UnaunthenticatedNavigation ref={ref} />
            :
                <AuthenticatedNavigation ref={ref} />
        )}
    </>
});