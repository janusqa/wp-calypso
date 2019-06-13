/** @format */

/**
 * External dependencies
 */

import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import PushNotificationIllustration from './push-notification-illustration';
import TwoFactorActions from './two-factor-actions';

class WaitingTwoFactorNotificationApproval extends Component {
	static propTypes = {
		translate: PropTypes.func.isRequired,
	};

	render() {
		const { translate } = this.props;

		return (
			<form>
				<Card className="two-factor-authentication__push-notification-screen is-compact">
					<p>
						{ translate(
							'We sent a push notification to your {{strong}}WordPress mobile app{{/strong}}. ' +
								'Once you get it and swipe or tap to confirm, this page will update.',
							{
								components: {
									strong: <strong />,
								},
							}
						) }
					</p>

					<PushNotificationIllustration />
				</Card>

				<div className="two-factor-authentication__actions">
					<div className="two-factor-authentication__actions-divider">
						<span>{ this.props.translate( 'or' ) }</span>
					</div>

					<TwoFactorActions twoFactorAuthType="push" />
				</div>
			</form>
		);
	}
}

export default localize( WaitingTwoFactorNotificationApproval );
