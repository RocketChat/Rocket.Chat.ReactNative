import React, { forwardRef, useEffect, useState } from 'react';
import { createAppContainer, createNavigator, createSwitchNavigator } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { useQuery } from '@apollo/react-hooks';
import { IS_AUTHENTICATED } from './api/queries/authentication.queries';
import { TokenPayload } from './security/models/token-payload';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import SecurityManager from './security/security-manager';

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

export const AuthenticatedNavigation: any = createAppContainer(createSwitchNavigator(
    {
        TimelinePage: {
            getScreen: () => require('./pages/TimelinePage').default
        },
    },
    {
        initialRouteName: 'TimelinePage'
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