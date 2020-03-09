import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import {Button} from "./Button";
import i18n from '../i18n';
import { ThreadModel } from '../models/threads';
import { appColors } from "../theme/colors";
import { appStyles } from "../theme/style";
import moment from "moment";
import 'moment/locale/nl';
import Urls from "../../../../app/containers/message/Urls"
import { ContentType } from '../enums/content-type';
import SecurityManager from '../security/security-manager';
import { useMutation } from 'refetch-queries';
import {ThreadsMutations, ThreadsQueries} from "../api";
import {BallBar} from "./BallBar";

/**
 * Defining the Metadata for an Item within the Timeline.
 */
const styles = StyleSheet.create({
    item: {
        padding: 30,
        marginBottom: 10,
        width: '100%',
        backgroundColor: appColors.light,
    },

    hiddenItem: {
        opacity: 0.5,
    },

    textAndPreview: {
        flexDirection: 'row',
        marginTop: 5,
    },

    preview: {
        flex: 1,
        width: 100,
        height: 80,
        resizeMode: 'cover',
    },

    publish: {
        width: 100,
        marginTop: 10,
    },

    threadTitle: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 15
    },

    allText: {
        flex: 2,
    },

    separator: {
        marginTop: 10,
        marginBottom: 10,
        width: '100%',
        height: 1,
        backgroundColor: appColors.muted,
        opacity: 0.6,
    },

    creatorText: {
        marginBottom: 7,
    },
});

export const TimelineItem = ({ item }: { item: ThreadModel }) => {
    const [rcAuthHeaders, setRcAuthHeaders] = useState({});
    const [performPublish, { loading: publishLoading }] = useMutation(ThreadsMutations.PUBLISH_THREAD);

    useEffect(() => {
        SecurityManager.getRocketChatHeaders().then(headers => setRcAuthHeaders(headers));
    }, []);

    //Gets and shows the userID
    const getUserId = (item: ThreadModel) => {
        return <Text>{item.createdByUser?.firstName}</Text>;
    };

    //shows the image preview for any thread with an image
    const renderImageInfo = () => {
        switch (item.type) {
            case ContentType.IMAGE:
                if (item.assetUrl) {
                    return <Image style={[styles.preview]} source={{ uri: item.assetUrl, headers: rcAuthHeaders }} />;
                }

                return;
            case ContentType.LINK:
            case ContentType.YOUTUBE:
                if (item.assetMetadata) {
                    return <Image style={[styles.preview]} source={{ uri: item.assetMetadata!.image }} />;
                }

                return;
        }
    };

    //Shows the date using moment.js
    const showDate = (item: ThreadModel) => {
        moment.locale();
        if (item.updatedAt) {
            return <Text>{moment(item.updatedAt).fromNow()}</Text>
        }

        return <Text>{moment(item.createdAt).fromNow()}</Text>;
    };

    // SHows an option to publish
    const renderPublish = () => {
        if (!item.published) {
            return <View style={[styles.publish]}>
                <Button title={i18n.t('timeline.publish')} loading={publishLoading} onPress={async () => {
                    try {
                        await performPublish({
                            variables: {
                                id: item._id,
                            },
                            refetchQueriesMatch: [
                                {
                                    query: ThreadsQueries.TIMELINE,
                                    variables: {}
                                }
                            ]
                        });
                    } catch (error) {
                        alert(error);
                    }
                }}/>
            </View>;
        }
    };

    //Shows an edited sign when a thread is edited.
    const checkUpdated = (item: ThreadModel) => {
        if (item.updatedAt) {
            return <Text>{i18n.t('timeline.edited')}</Text>
        }
    }

    if (!rcAuthHeaders) {
        return <View></View>;
    }

    return <View style={[styles.item, !item.published ? styles.hiddenItem : {}]}>
        <Text style={[styles.creatorText, { color: appColors.muted }]}> {getUserId(item)}  -  {showDate(item)}{checkUpdated(item)}</Text>
        <View style={[styles.textAndPreview]}>
            <View style={[styles.allText]}>
                <Text style={[appStyles.heading]}>{item.title}</Text>
                <Text style={[appStyles.text]}>{item.description}</Text>
                {renderPublish()}
            </View>
            {renderImageInfo()}
        </View>
        {item.published && <>
            <View style={styles.separator} />
            <BallBar item={item}/>
        </>}
    </View>

};
