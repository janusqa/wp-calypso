import config from '@automattic/calypso-config';
import { PostStatsCard } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import { useSelector } from 'react-redux';
import QueryPostStats from 'calypso/components/data/query-post-stats';
import { decodeEntities, stripHTML } from 'calypso/lib/formatting';
import { getCurrentUserLocale } from 'calypso/state/current-user/selectors';
import { getPostsForQuery, isRequestingPostsForQuery } from 'calypso/state/posts/selectors';
import { getPostStat, isRequestingPostStats } from 'calypso/state/stats/posts/selectors';

const POST_STATS_CARD_TITLE_LIMIT = 60;

// Use ellipsis when characters count over the limit.
// TODO: Extract to shared utilities
const textTruncator = ( text: string, limit = 48 ) => {
	if ( ! text ) {
		return '';
	}

	const truncatedText = text.substring( 0, limit );

	return `${ truncatedText }${ text.length > limit ? '...' : '' } `;
};

export default function LatestPostCard( {
	siteId,
	siteSlug,
}: {
	siteId: number;
	siteSlug: string;
} ) {
	const translate = useTranslate();
	const userLocale = useSelector( getCurrentUserLocale );
	const isOdysseyStats = config.isEnabled( 'is_running_in_jetpack_site' );

	const posts = useSelector( ( state ) =>
		getPostsForQuery( state, siteId, { status: 'publish', number: 1 } )
	);

	const isRequestingPosts = useSelector( ( state ) =>
		isRequestingPostsForQuery( state, siteId, { status: 'publish', number: 1 } )
	);

	const latestPost = posts && posts.length ? posts[ 0 ] : null;

	const lastesPostViewCount = useSelector( ( state ) =>
		getPostStat( state, siteId, latestPost?.ID, 'views' )
	);

	const isRequestingLatestPostViewCount = useSelector( ( state ) =>
		isRequestingPostStats( state, siteId, latestPost?.ID, [ 'views' ] )
	);

	const isLoadingLatestPost = isRequestingPosts || isRequestingLatestPostViewCount;

	const latestPostData = {
		date: latestPost?.date,
		post_thumbnail: latestPost?.post_thumbnail?.URL || null,
		title: decodeEntities(
			stripHTML( textTruncator( latestPost?.title, POST_STATS_CARD_TITLE_LIMIT ) )
		),
		likeCount: latestPost?.like_count,
		viewCount: lastesPostViewCount || 0,
		commentCount: latestPost?.discussion?.comment_count,
	};

	return (
		<>
			{ siteId && latestPost && (
				<QueryPostStats siteId={ siteId } postId={ latestPost.ID } fields={ [ 'views' ] } />
			) }

			{ ( isLoadingLatestPost || latestPost ) && (
				<PostStatsCard
					heading={ translate( 'Latest post' ) }
					likeCount={ latestPostData?.likeCount }
					post={ latestPostData }
					viewCount={ latestPostData?.viewCount }
					commentCount={ latestPostData?.commentCount }
					titleLink={ `/stats/post/${ latestPost?.ID }/${ siteSlug }` }
					uploadHref={ ! isOdysseyStats ? `/post/${ siteSlug }/${ latestPost?.ID }` : undefined }
					locale={ userLocale }
					isLoading={ isLoadingLatestPost }
				/>
			) }
		</>
	);
}
