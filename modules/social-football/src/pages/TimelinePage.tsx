import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { appStyles } from '../theme/style';
import { SafeAreaView } from 'react-navigation';
import { appColors } from '../theme/colors';
import i18n from '../i18n'
import { HeaderLogo } from '../components/header/HeaderLogo';
import { HeaderCreateThreadButton } from '../components/header/HeaderCreateThreadButton';
import { useQuery } from 'react-apollo';
import { ThreadsQueries } from '../api';
import { PaginatedThreads } from '../models/threads';
import { TimelineItem } from '../components/TimelineItem';
import { InfiniteScrollView } from "../components/InfiniteScrollView";
import { HeaderLeaderboardButton } from '../components/header/HeaderLeaderboardButton';
import { HeaderTitle } from 'react-navigation-stack';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#FFF1E5'
    },

    icon: {
        width: 25,
        height: 25,
    },

    filterBackGround: {
        backgroundColor: '#FFF1E5',
    },

    filterbar: {
        marginTop: 20,
        marginBottom: 20,
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 25,
        width: '100%',
        paddingLeft: 30,
        paddingRight: 30,
    },

    filterText: {
        fontWeight: 'bold',
    },

});

const TimelinePage = ({ navigation }) => {
    const perPage = 6;

    const { data, error, fetchMore, loading } = useQuery<{ getThreads: PaginatedThreads }>(ThreadsQueries.TIMELINE, {
        variables: {
            limit: perPage,
        },
        fetchPolicy: "cache-and-network"
    });

    const fetchMoreResults = () => {
        if (loading) {
            return;
        }

        if (!fetchMore) {
            return;
        }

        fetchMore({
            variables: {
                offset: data?.getThreads.threads.length,
                limit: perPage,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;

                return {
                    getThreads: {
                        threads: [...prev.getThreads.threads, ...fetchMoreResult.getThreads.threads],
                        limit: perPage,
                        offset: fetchMoreResult.getThreads.offset,
                        total: prev.getThreads.threads.length + fetchMoreResult.getThreads.threads.length,
                    },
                }
            },
        })
    };

    return <>

        <View style={[styles.filterBackGround]}>
            <View style={[styles.filterbar]}>
                <Text style={[styles.filterText]}>Alle berichten.</Text>
                <Image style={[]} source={require('../assets/images/refresh.png')} />
            </View>
        </View>

        <InfiniteScrollView onEndReached={() => fetchMoreResults()}>
            <View style={styles.container}>
                {data?.getThreads.threads.map((item, index) => <TimelineItem key={index} item={item} />)}
            </View>
        </InfiniteScrollView>
    </>;
};

TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight: <HeaderCreateThreadButton navigation={navigation} />,
        headerLeft: <HeaderLeaderboardButton navigation={navigation} />,
    };

};

export default TimelinePage;
