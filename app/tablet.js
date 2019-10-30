import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import DeviceInfo from 'react-native-device-info';

import KeyCommands from './commands';
import { RoomContainer, ModalContainer } from './index';
import { SIDEBAR_WIDTH } from './constants/tablet';

import sharedStyles from './views/Styles';

const Tablet = ({
	children, tablet, inside, showModal, onLayout, roomRef, modalRef
}) => {
	const renderSplit = (split) => {
		if (split) {
			return (
				<>
					<View style={[sharedStyles.container, sharedStyles.separatorLeft]}>
						<RoomContainer
							ref={roomRef}
						/>
					</View>
					<ModalContainer
						showModal={showModal}
						ref={modalRef}
					/>
				</>
			);
		}
		return null;
	};

	if (DeviceInfo.isTablet()) {
		const split = tablet && inside;
		return (
			<KeyCommands>
				<View style={sharedStyles.containerSplitView} onLayout={onLayout}>
					<View style={[sharedStyles.container, split && { maxWidth: SIDEBAR_WIDTH }]}>
						{children}
					</View>
					{renderSplit(split)}
				</View>
			</KeyCommands>
		);
	}
	return children;
};

Tablet.propTypes = {
	children: PropTypes.node,
	tablet: PropTypes.bool,
	inside: PropTypes.bool,
	showModal: PropTypes.bool,
	onLayout: PropTypes.func,
	roomRef: PropTypes.func,
	modalRef: PropTypes.func
};

export default Tablet;
