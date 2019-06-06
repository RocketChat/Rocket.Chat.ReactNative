import React from 'react'
import { View, Text, ViewPropTypes } from 'react-native';
import PropTypes from 'prop-types';
import Avatar from '../../containers/Avatar';
import Touch from '../../utils/touch';
import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { connect } from 'react-redux';

@connect(state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		username: state.login.user,
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
}))

export default class UserItem extends React.Component {
  static propTypes = {
  	name: PropTypes.string.isRequired,
  	username: PropTypes.string.isRequired,
  	user: PropTypes.shape({
      username: PropTypes.string,
  		id: PropTypes.string,
  		token: PropTypes.string
  	}),
  	baseUrl: PropTypes.string.isRequired,
  	onPress: PropTypes.func.isRequired,
  	testID: PropTypes.string.isRequired,
  	onLongPress: PropTypes.func,
  	style: ViewPropTypes.style,
  	icon: PropTypes.string,
    following: PropTypes.bool,
  };

  constructor(props) {
    super(props);


    this.state = {
      following: props.following
    }
  }
  onPressFollow = (item) => {
    console.warn('Pressed on pressFollow');
    this.setState({
      following: !this.state.following
    });
  }
  render() {
      const {
        name, username, user, baseUrl, onPress, testID, onLongPress, style, icon, following
       } = this.props
      return (
        <Touch onPress={onPress} onLongPress={onLongPress} style={styles.button} testID={testID}>
      		<View style={[styles.container, style]}>
      			<Avatar text={username} size={30} type='d' style={styles.avatar} baseUrl={baseUrl} userId={user.id} token={user.token} />
      			<View style={styles.textContainer}>
      				<Text style={styles.name}>{name}</Text>
      				<Text style={styles.username}>@{username}</Text>
      			</View>
      			<Touch onPress={()=>this.onPressFollow(username)} style = {styles.followContainer}>
      				{this.state.following ? <CustomIcon name={'check'} size={22} style={styles.icon} />  : <CustomIcon name={'plus'} size={22} style={styles.icon} />}
      			</Touch>
      			{icon ? <CustomIcon name={icon} size={22} style={styles.icon} /> : null}
      		</View>
      	</Touch>
      )
  }
}
