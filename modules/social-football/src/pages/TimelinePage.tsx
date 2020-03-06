import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, Button, ScrollView, ActivityIndicator } from 'react-native';
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
import {InfiniteScrollView} from "../components/InfiniteScrollView";
import { HeaderLeaderboardButton } from '../components/header/HeaderLeaderboardButton';
import { HeaderTitle } from 'react-navigation-stack';
import { ContentType } from '../enums/content-type';
import { FilterOption } from '../models/filter-option';
import { Dropdown } from 'react-native-material-dropdown';

/**
 * Defines the standard Stylesheet for the Timeline Page.
 */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: appColors.lightPrimary,
    },

    icon: {
        width: 25,
        height: 25,
    },

    topBar: {
        height: 50,
    },

    filterBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: 30,
        paddingRight: 30,
        backgroundColor: appColors.lightPrimary,
    },

    filtermenu: {
        width: '60%',
        fontWeight: 'bold',
        color: appColors.text,
        marginBottom: 15,
    },

    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        opacity: 0,
    },
});

/**
 * Creates the Page.
 */
const TimelinePage = ({ navigation }) => {
    
    //The maximum amount of threads that are loaded at once by Lazy Loading
    const perPage = 6;

    // Array of contenttypes that can be selected from
    const filterOptions: FilterOption[] = [
        { value: i18n.t('filterOptions.all') },
        { contentType: ContentType.TEXT, value: i18n.t('filterOptions.text') },
        { contentType: ContentType.IMAGE, value: i18n.t('filterOptions.image') },
        { contentType: ContentType.YOUTUBE, value: i18n.t('filterOptions.video') },
        { contentType: ContentType.LINK, value: i18n.t('filterOptions.link') },
    ];

    // Hook for filter state
    const [filterIndex, setFilterIndex] = useState(0);

    /**
     * Fetching more Threads
     */
    const { data, error, fetchMore, loading } = useQuery<{ getThreads: PaginatedThreads }>(ThreadsQueries.TIMELINE, {
        variables: {
            limit: perPage,
            filterType: filterOptions[filterIndex].contentType,
        },
        fetchPolicy: "cache-and-network"
    });

    const fetchMoreResults = () => {
        if (loading) {
            return;
        }

        fetchMore({
            variables: {
                offset: data?.getThreads.threads.length,
                limit: perPage,
                filterType: filterOptions[filterIndex].contentType,
            },
            updateQuery: (prev, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prev;

                const ids: string[] = [];

                return {
                    getThreads: {
                        threads: [...prev.getThreads.threads, ...fetchMoreResult.getThreads.threads].filter(item => {
                            if (ids.indexOf(item._id!) === -1) {
                                ids.push(item._id!);
                                return true;
                            }

                            return false;
                        }),
                        limit: perPage,
                        offset: fetchMoreResult.getThreads.offset,
                        total: prev.getThreads.threads.length + fetchMoreResult.getThreads.threads.length,
                    },
                }
            },
        })
    };

    const renderLoader = () => {
        return <View style={[styles.loading, { opacity: loading ? 1 : 0}]}><ActivityIndicator /></View>
    };

    return <>
        <View style={[styles.topBar]}>
        <View style={[styles.filterBar]}>
        <View style={[styles.filtermenu]}>
            <Dropdown
                style={[styles.filtermenu]}
                data={filterOptions}
                value={filterOptions[filterIndex].value}
                onChangeText={(value, index, data) => setFilterIndex(index)}
            />
            </View>
            
            <Image source={require('../assets/images/refresh.png')} />
        </View>
        </View>
        <InfiniteScrollView onEndReached={() => fetchMoreResults()}>
            <View style={styles.container}>
                {data?.getThreads.threads.map((item, index) => <TimelineItem key={index} item={item} />)}
                {renderLoader()}
            </View>
        </InfiniteScrollView>
    </>;
};

/**
 * Creation of the Page.
 */
TimelinePage.navigationOptions = ({ navigation }) => {
    return {
        headerTitle: <HeaderLogo />,
        headerRight: <HeaderCreateThreadButton navigation={navigation} />,
        headerLeft: <HeaderLeaderboardButton navigation={navigation} />,
    };
};

export default TimelinePage;
