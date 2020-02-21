import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import { ContentType } from '../enums/content-type';
import { appColors } from '../theme/colors';

const styles = StyleSheet.create({
    activeBorder: {
        borderColor: appColors.primary,
        position: 'absolute',
        borderWidth: 3,
    },
    container: {
        shadowColor: appColors.dark,
        shadowRadius: 20,
        shadowOpacity: 0.20,
    },
    frame: {
        width: 66,
        height: 66,
        borderRadius: 8,
    },
    iconHolder: {
        position: 'absolute',
        zIndex: 2,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    }
});

export const ContentTypeButton = ({ type, onPress, active }: { type: ContentType, active?: boolean, onPress: () => any|void }) => {
    const renderBackground = () => {
        switch (type) {
            case ContentType.TEXT:
                return <Image style={[styles.frame]} source={require(`../assets/images/content-type-text-background.png`)} />;
            case ContentType.LINK:
                return <Image style={[styles.frame]} source={require(`../assets/images/content-type-link-background.png`)} />;
            case ContentType.IMAGE:
                return <Image style={[styles.frame]} source={require(`../assets/images/content-type-image-background.png`)} />;
            case ContentType.YOUTUBE:
                return <Image style={[styles.frame]} source={require(`../assets/images/content-type-youtube-background.png`)} />;
        }
    };

    const renderIcon = () => {
        switch (type) {
            case ContentType.TEXT:
                return <Image source={require(`../assets/images/content-type-text.png`)} />;
            case ContentType.LINK:
                return <Image source={require(`../assets/images/content-type-link.png`)} />;
            case ContentType.IMAGE:
                return <Image source={require(`../assets/images/content-type-image.png`)} />;
            case ContentType.YOUTUBE:
                return <Image source={require(`../assets/images/content-type-youtube.png`)} />;
        }
    };

    const renderIconActive = () => {
        switch (type) {
            case ContentType.TEXT:
                return <Image source={require(`../assets/images/content-type-text-active.png`)} />;
            case ContentType.LINK:
                return <Image source={require(`../assets/images/content-type-link-active.png`)} />;
            case ContentType.IMAGE:
                return <Image source={require(`../assets/images/content-type-image-active.png`)} />;
            case ContentType.YOUTUBE:
                return <Image source={require(`../assets/images/content-type-youtube-active.png`)} />;
        }
    };

    const renderBorder = () => (
        <View style={[styles.frame, styles.activeBorder]} />
    );

    return <TouchableOpacity onPress={onPress}>
        <View style={[styles.frame, styles.container]}>
            {renderBackground()}
            <View style={[styles.frame, styles.iconHolder]}>
                {active ? renderIconActive() : renderIcon()}
            </View>
            {active ? renderBorder() : null}
        </View>
    </TouchableOpacity>
};
