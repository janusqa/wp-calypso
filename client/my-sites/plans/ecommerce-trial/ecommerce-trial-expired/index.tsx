import { recordTracksEvent } from '@automattic/calypso-analytics';
import { isEnabled } from '@automattic/calypso-config';
import { PLAN_ECOMMERCE_TRIAL_MONTHLY } from '@automattic/calypso-products';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import QueryPlans from 'calypso/components/data/query-plans';
import QuerySitePurchases from 'calypso/components/data/query-site-purchases';
import Main from 'calypso/components/main';
import BodySectionCssClass from 'calypso/layout/body-section-css-class';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import ECommercePlanFeatures from 'calypso/my-sites/plans/components/ecommerce-plan-features';
import { WooExpressPlans } from 'calypso/my-sites/plans/ecommerce-trial/wooexpress-plans';
import { getExpiredTrialWooExpressMediumFeatureSets } from 'calypso/my-sites/plans/ecommerce-trial/wx-medium-features';
import { getSitePurchases } from 'calypso/state/purchases/selectors';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';

import './style.scss';

const ECommerceTrialExpired = (): JSX.Element => {
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId );
	const siteSlug = useSelector( getSelectedSiteSlug );
	const sitePurchases = useSelector( ( state ) => getSitePurchases( state, siteId ) );

	const nonECommerceTrialPurchases = useMemo(
		() =>
			sitePurchases.filter( ( purchase ) => purchase.productSlug !== PLAN_ECOMMERCE_TRIAL_MONTHLY ),
		[ sitePurchases ]
	);

	const [ interval, setInterval ] = useState( 'monthly' as 'monthly' | 'yearly' );

	const { monthlyControlProps, yearlyControlProps } = useMemo( () => {
		return {
			monthlyControlProps: {
				onClick: () => setInterval( 'monthly' ),
			},
			yearlyControlProps: {
				onClick: () => setInterval( 'yearly' ),
			},
		};
	}, [ setInterval ] );

	const expiredTrialWooExpressMediumPlanFeatureSets = useMemo( () => {
		return getExpiredTrialWooExpressMediumFeatureSets( { translate, interval } );
	}, [ translate, interval ] );

	const triggerTracksEvent = useCallback( ( tracksLocation: string ) => {
		recordTracksEvent( 'calypso_wooexpress_expired_trial_upgrade_cta_clicked', {
			location: tracksLocation,
		} );
	}, [] );

	const triggerPlansGridTracksEvent = useCallback( ( planSlug: string ) => {
		recordTracksEvent( 'calypso_wooexpress_expired_trial_upgrade_cta_clicked', {
			location: 'plans_grid',
			plan_slug: planSlug,
		} );
	}, [] );

	const plansContent = isEnabled( 'plans/wooexpress-small' ) ? (
		<WooExpressPlans
			interval={ interval }
			monthlyControlProps={ monthlyControlProps }
			siteId={ siteId ?? 0 }
			siteSlug={ siteSlug ?? '' }
			triggerTracksEvent={ triggerPlansGridTracksEvent }
			yearlyControlProps={ yearlyControlProps }
		/>
	) : (
		<ECommercePlanFeatures
			interval={ interval }
			monthlyControlProps={ monthlyControlProps }
			planFeatureSets={ expiredTrialWooExpressMediumPlanFeatureSets }
			priceCardSubtitle={ translate(
				'Kickstart your growth with the world’s most-trusted ecommerce platform.'
			) }
			siteSlug={ siteSlug }
			triggerTracksEvent={ triggerTracksEvent }
			yearlyControlProps={ yearlyControlProps }
		/>
	);

	return (
		<>
			<QueryPlans />
			{ siteId && <QuerySitePurchases siteId={ siteId } /> }
			<BodySectionCssClass bodyClass={ [ 'is-expired-ecommerce-trial-plan' ] } />
			<Main wideLayout>
				<PageViewTracker
					path="/plans/my-plan/trial-expired/:site"
					title="Plans > Ecommerce Trial Expired"
				/>
				<div className="ecommerce-trial-expired__content">
					<div className="ecommerce-trial-expired__header">
						<h1 className="ecommerce-trial-expired__title">
							{ translate( 'Your free trial has ended' ) }
						</h1>
						<div className="ecommerce-trial-expired__subtitle">
							{ translate(
								'Don’t lose all that hard work! Upgrade to a paid plan to continue working on your store.' +
									' ' +
									'Unlock more features, launch and start selling, and make your business venture a reality.'
							) }
						</div>
						{ nonECommerceTrialPurchases && nonECommerceTrialPurchases.length > 0 && (
							<div className="ecommerce-trial-expired__manage-purchases">
								<a href={ `/purchases/subscriptions/${ siteSlug }` }>
									{ translate( 'Manage your previous purchases' ) }
								</a>
							</div>
						) }
					</div>
				</div>

				{ plansContent }
			</Main>
		</>
	);
};

export default ECommerceTrialExpired;
