import { Button, Card, Gridicon } from '@automattic/components';
import { localize } from 'i18n-calypso';
import { connect } from 'react-redux';
import ExternalLink from 'calypso/components/external-link';
import FormCheckbox from 'calypso/components/forms/form-checkbox';
import FormLabel from 'calypso/components/forms/form-label';
import HappychatButton from 'calypso/components/happychat/button';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import ActivityIcon from '../activity-log-item/activity-icon';

import './style.scss';

/* eslint-disable wpcalypso/jsx-classname-namespace */
const ActivityLogConfirmDialog = ( {
	children,
	confirmTitle,
	disableButton,
	icon = 'history',
	notice,
	onClose,
	onConfirm,
	onSettingsChange,
	supportLink,
	title,
	translate,
	happychatEvent,
} ) => (
	<div className="activity-log-item activity-log-item__restore-confirm">
		<div className="activity-log-item__type">
			<ActivityIcon activityIcon={ icon } />
		</div>
		<Card className="activity-log-item__card">
			<h5 className="activity-log-confirm-dialog__title">{ title }</h5>

			<div className="activity-log-confirm-dialog__highlight">{ children }</div>

			<div className="activity-log-confirm-dialog__partial-restore-settings">
				<p>
					{ notice
						? translate( 'Choose the items you wish to restore:' )
						: translate( 'Choose the items you wish to include in the download:' ) }
				</p>
				<FormLabel>
					<FormCheckbox name="themes" onChange={ onSettingsChange } defaultChecked />
					{ translate( 'WordPress Themes' ) }
				</FormLabel>
				<FormLabel>
					<FormCheckbox name="plugins" onChange={ onSettingsChange } defaultChecked />
					{ translate( 'WordPress Plugins' ) }
				</FormLabel>
				<FormLabel>
					<FormCheckbox name="uploads" onChange={ onSettingsChange } defaultChecked />
					{ translate( 'Media Uploads' ) }
				</FormLabel>
				<FormLabel>
					<FormCheckbox name="roots" onChange={ onSettingsChange } defaultChecked />
					{ translate( 'WordPress Root (includes wp-config.php and any non-WordPress files)' ) }
				</FormLabel>
				<FormLabel>
					<FormCheckbox name="contents" onChange={ onSettingsChange } defaultChecked />
					{ translate( 'WP-Content Directory (excluding themes, plugins, and uploads)' ) }
				</FormLabel>
				<FormLabel>
					<FormCheckbox name="sqls" onChange={ onSettingsChange } defaultChecked />
					{ translate( 'Site Database (SQL)' ) }
				</FormLabel>
			</div>

			{ notice && (
				<div className="activity-log-confirm-dialog__notice">
					<Gridicon icon="notice" />
					<span className="activity-log-confirm-dialog__notice-content">{ notice }</span>
				</div>
			) }

			<div className="activity-log-confirm-dialog__button-wrap">
				<div className="activity-log-confirm-dialog__primary-actions">
					<Button onClick={ onClose }>{ translate( 'Cancel' ) }</Button>
					<Button primary disabled={ disableButton } onClick={ onConfirm }>
						{ confirmTitle }
					</Button>
				</div>
				<div className="activity-log-confirm-dialog__secondary-actions">
					<ExternalLink icon href={ supportLink } onClick={ () => {} }>
						{ translate( 'More info' ) }
					</ExternalLink>
					<HappychatButton
						className="activity-log-confirm-dialog__more-info-link"
						onClick={ happychatEvent }
					>
						<Gridicon icon="chat" />
						<span>{ translate( 'Any Questions?' ) }</span>
					</HappychatButton>
				</div>
			</div>
		</Card>
	</div>
);
/* eslint-enable wpcalypso/jsx-classname-namespace */

const mapDispatchToProps = {
	happychatEvent: () => recordTracksEvent( 'calypso_activitylog_confirm_dialog' ),
};

export default connect( null, mapDispatchToProps )( localize( ActivityLogConfirmDialog ) );
