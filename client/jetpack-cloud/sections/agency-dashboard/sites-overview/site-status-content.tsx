import { isEnabled } from '@automattic/calypso-config';
import { Button, Gridicon, ShortenedNumber } from '@automattic/components';
import { Icon, arrowUp, arrowDown } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import classNames from 'classnames';
import { translate } from 'i18n-calypso';
import page from 'page';
import { useRef, useState, useMemo, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Badge from 'calypso/components/badge';
import Tooltip from 'calypso/components/tooltip';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { selectLicense, unselectLicense } from 'calypso/state/jetpack-agency-dashboard/actions';
import { hasSelectedLicensesOfType } from 'calypso/state/jetpack-agency-dashboard/selectors';
import { isJetpackSiteMultiSite } from 'calypso/state/sites/selectors';
import ToggleActivateMonitoring from '../downtime-monitoring/toggle-activate-monitoring';
import SitesOverviewContext from './context';
import SiteSelectCheckbox from './site-select-checkbox';
import SiteSetFavorite from './site-set-favorite';
import {
	getRowMetaData,
	getProductSlugFromProductType,
	getBoostRating,
	getBoostRatingClass,
} from './utils';
import type { AllowedTypes, SiteData } from './types';

interface Props {
	rows: SiteData;
	type: AllowedTypes;
	isLargeScreen?: boolean;
	isFavorite?: boolean;
}

export default function SiteStatusContent( {
	rows,
	type,
	isLargeScreen = false,
	isFavorite = false,
}: Props ) {
	const dispatch = useDispatch();

	const {
		link,
		isExternalLink,
		row: { value, status, error },
		siteError,
		tooltipId,
		siteDown,
		eventName,
		...metadataRest
	} = getRowMetaData( rows, type, isLargeScreen );

	let { tooltip } = metadataRest;

	const { isBulkManagementActive } = useContext( SitesOverviewContext );
	const isExpandedBlockEnabled = isEnabled( 'jetpack/pro-dashboard-expandable-block' );

	const siteId = rows.site.value.blog_id;
	const siteUrl = rows.site.value.url;

	const isLicenseSelected = useSelector( ( state ) =>
		hasSelectedLicensesOfType( state, siteId, type )
	);

	const isMultiSite = useSelector( ( state ) => isJetpackSiteMultiSite( state, siteId ) );

	// Disable clicks/hover when there is a site error &
	// when the row is not monitor and monitor status is down
	// since monitor is clickable when site is down.
	const disabledStatus = siteError || ( type !== 'monitor' && siteDown );

	const statusContentRef = useRef< HTMLSpanElement | null >( null );
	const [ showTooltip, setShowTooltip ] = useState( false );

	const handleShowTooltip = () => {
		setShowTooltip( true );
	};
	const handleHideTooltip = () => {
		setShowTooltip( false );
	};

	const handleClickRowAction = () => {
		dispatch( recordTracksEvent( eventName ) );
	};

	const issueLicenseRedirectUrl = useMemo( () => {
		return addQueryArgs( `/partner-portal/issue-license/`, {
			site_id: siteId,
			product_slug: getProductSlugFromProductType( type ),
			source: 'dashboard',
		} );
	}, [ siteId, type ] );

	const handleSelectLicenseAction = () => {
		const inactiveProducts = Object.values( rows ).filter( ( row ) => row?.status === 'inactive' );
		if ( inactiveProducts.length > 1 ) {
			return dispatch( selectLicense( siteId, type ) );
		}
		// Redirect to issue-license if there is only one inactive product available for a site
		return page( issueLicenseRedirectUrl );
	};

	const handleDeselectLicenseAction = () => {
		dispatch( unselectLicense( siteId, type ) );
	};

	const hasBoost = rows.site.value.has_boost;

	function getTrendIcon( viewsTrend: 'up' | 'down' ) {
		if ( viewsTrend === 'up' ) {
			return arrowUp;
		} else if ( viewsTrend === 'down' ) {
			return arrowDown;
		}
	}

	if ( type === 'site' ) {
		// Site issues is the sum of scan threats and plugin updates
		let siteIssuesCount = rows.scan.threats + rows.plugin.updates;
		let isHighSeverityError = !! rows.scan.threats;
		if ( [ 'failed', 'warning' ].includes( rows.backup.status ) ) {
			siteIssuesCount = siteIssuesCount + 1;
			isHighSeverityError = isHighSeverityError || 'failed' === rows.backup.status;
		}
		if ( [ 'failed' ].includes( rows.monitor.status ) ) {
			siteIssuesCount = siteIssuesCount + 1;
			isHighSeverityError = true;
		}
		let errorContent;
		if ( error ) {
			errorContent = (
				<span className="sites-overview__status-critical">
					<Gridicon size={ 24 } icon="notice-outline" />
				</span>
			);
		} else if ( siteIssuesCount ) {
			errorContent = (
				<span
					className={ classNames(
						'sites-overview__status-count',
						isHighSeverityError ? 'sites-overview__status-failed' : 'sites-overview__status-warning'
					) }
				>
					{ siteIssuesCount }
				</span>
			);
		}

		return (
			<>
				{ isBulkManagementActive ? (
					<SiteSelectCheckbox
						isLargeScreen={ isLargeScreen }
						item={ rows }
						siteError={ siteError }
					/>
				) : (
					<SiteSetFavorite
						isFavorite={ isFavorite }
						siteId={ rows.site.value.blog_id }
						siteUrl={ siteUrl }
					/>
				) }
				{ isLargeScreen ? (
					<Button
						className="sites-overview__row-text"
						borderless
						compact
						href={ `/activity-log/${ siteUrl }` }
					>
						{ siteUrl }
					</Button>
				) : (
					<span className="sites-overview__row-text">{ siteUrl }</span>
				) }
				<span className="sites-overview__overlay"></span>
				{ errorContent }
			</>
		);
	}

	let content;

	// Show "Not supported on multisite" when the the site is multisite and the product is Scan or
	// Backup and the site does not have a backup subscription https://href.li/?https://wp.me/pbuNQi-1jg
	const showMultisiteNotSupported =
		isMultiSite && ( type === 'scan' || ( type === 'backup' && ! rows.site.value.has_backup ) );

	if ( showMultisiteNotSupported ) {
		content = <Gridicon icon="minus-small" size={ 18 } className="sites-overview__icon-active" />;
		tooltip = translate( 'Not supported on multisite' );
	} else {
		// We will show "Site Down" when the site is down which is handled differently.
		if ( type === 'monitor' && ! siteDown ) {
			return (
				<ToggleActivateMonitoring
					site={ rows.site.value }
					settings={ rows.monitor.settings }
					status={ status }
					tooltip={ tooltip }
					tooltipId={ tooltipId }
					siteError={ siteError }
					isLargeScreen={ isLargeScreen }
				/>
			);
		}

		if ( type === 'stats' ) {
			const { total: totalViews, trend: viewsTrend } = rows.stats.value.views;
			if ( viewsTrend === 'same' ) {
				return (
					<>
						<span className="sites-overview__stats-trend sites-overview__stats-trend__same" />
						<div className="sites-overview__stats">
							<ShortenedNumber value={ totalViews } />
						</div>
					</>
				);
			}
			const trendIcon = getTrendIcon( viewsTrend );
			return (
				<span
					className={ classNames( 'sites-overview__stats-trend', {
						'sites-overview__stats-trend__up': viewsTrend === 'up',
						'sites-overview__stats-trend__down': viewsTrend === 'down',
					} ) }
				>
					{ trendIcon && <Icon icon={ trendIcon } size={ 16 } /> }
					<div className="sites-overview__stats">
						<ShortenedNumber value={ totalViews } />
					</div>
				</span>
			);
		}

		if ( type === 'boost' ) {
			const overallScore = rows.site.value.jetpack_boost_scores.overall;
			if ( hasBoost ) {
				return (
					<div
						className={ classNames(
							'sites-overview__boost-score',
							getBoostRatingClass( overallScore )
						) }
					>
						{ translate( '%(rating)s Score', {
							args: { rating: getBoostRating( overallScore ) },
							comment: '%rating will be replaced by boost rating, e.g. "A", "B", "C", "D", or "F"',
						} ) }
					</div>
				);
			}
			return <div></div>;
		}

		switch ( status ) {
			case 'critical': {
				content = <div className="sites-overview__critical">{ value }</div>;
				break;
			}
			case 'failed': {
				content = isExpandedBlockEnabled ? (
					<div className="sites-overview__failed">{ value }</div>
				) : (
					<Badge className="sites-overview__badge" type="error">
						{ value }
					</Badge>
				);
				break;
			}
			case 'warning': {
				content = isExpandedBlockEnabled ? (
					<div className="sites-overview__warning">{ value }</div>
				) : (
					<Badge className="sites-overview__badge" type="warning">
						{ value }
					</Badge>
				);
				break;
			}
			case 'success': {
				content = <Gridicon icon="checkmark" size={ 18 } className="sites-overview__grey-icon" />;
				break;
			}
			case 'disabled': {
				content = (
					<Gridicon icon="minus-small" size={ 18 } className="sites-overview__icon-active" />
				);
				break;
			}
			case 'progress': {
				content = <Gridicon icon="time" size={ 18 } className="sites-overview__grey-icon" />;
				break;
			}
			case 'inactive': {
				content = ! isLicenseSelected ? (
					<button onClick={ handleSelectLicenseAction }>
						<span className="sites-overview__status-select-license">
							<Gridicon icon="plus-small" size={ 16 } />
							<span>{ translate( 'Add' ) }</span>
						</span>
					</button>
				) : (
					<button onClick={ handleDeselectLicenseAction }>
						<span className="sites-overview__status-unselect-license">
							<Gridicon icon="checkmark" size={ 16 } />
							<span>{ translate( 'Selected' ) }</span>
						</span>
					</button>
				);
				break;
			}
		}
	}

	let updatedContent = content;

	if ( ! showMultisiteNotSupported ) {
		if ( link ) {
			let target = '_self';
			let rel;
			if ( isExternalLink ) {
				target = '_blank';
				rel = 'noreferrer';
			}
			updatedContent = (
				<a
					data-testid={ `row-${ tooltipId }` }
					target={ target }
					rel={ rel }
					onClick={ handleClickRowAction }
					href={ link }
				>
					{ content }
				</a>
			);
		}

		if ( disabledStatus ) {
			updatedContent = (
				<span className="sites-overview__disabled sites-overview__row-status">{ content } </span>
			);
		}
	}

	return (
		<>
			{ tooltip && ! disabledStatus ? (
				<>
					<span
						ref={ statusContentRef }
						role="button"
						tabIndex={ 0 }
						onMouseEnter={ handleShowTooltip }
						onMouseLeave={ handleHideTooltip }
						onMouseDown={ handleHideTooltip }
						className="sites-overview__row-status"
					>
						{ updatedContent }
					</span>
					<Tooltip
						id={ tooltipId }
						context={ statusContentRef.current }
						isVisible={ showTooltip }
						position="bottom"
						className="sites-overview__tooltip"
					>
						{ tooltip }
					</Tooltip>
				</>
			) : (
				<span className="sites-overview__row-status">{ updatedContent }</span>
			) }
		</>
	);
}
