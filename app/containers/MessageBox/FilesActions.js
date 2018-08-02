import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ActionSheet from 'react-native-actionsheet';

import I18n from '../../i18n';

export default class FilesActions extends Component {
	static propTypes = {
		hideActions: PropTypes.func.isRequired,
		takePhoto: PropTypes.func.isRequired,
		chooseFromLibrary: PropTypes.func.isRequired
	}

	constructor(props) {
		super(props);

		// Cancel
		this.options = [I18n.t('Cancel')];
		this.CANCEL_INDEX = 0;

		// Photo
		this.options.push(I18n.t('Take_a_photo'));
		this.PHOTO_INDEX = 1;

		// Library
		this.options.push(I18n.t('Choose_from_library'));
		this.LIBRARY_INDEX = 2;

		setTimeout(() => {
			if (this.actionSheet && this.actionSheet.show) {
				this.actionSheet.show();
			}
		});
	}

	handleActionPress = (actionIndex) => {
		const { takePhoto, chooseFromLibrary } = this.props;
		switch (actionIndex) {
			case this.PHOTO_INDEX:
				takePhoto();
				break;
			case this.LIBRARY_INDEX:
				chooseFromLibrary();
				break;
			default:
				break;
		}
		this.props.hideActions();
	}

	render() {
		return (
			<ActionSheet
				ref={o => this.actionSheet = o}
				options={this.options}
				cancelButtonIndex={this.CANCEL_INDEX}
				onPress={this.handleActionPress}
			/>
		);
	}
}
