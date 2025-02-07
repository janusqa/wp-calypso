/**
 * @jest-environment jsdom
 */

import { withStorageKey } from '@automattic/state-utils';
import { mapKeys } from 'lodash';
import * as browserStorage from 'calypso/lib/browser-storage';
import { isSupportSession } from 'calypso/lib/user/support-user-interop';
import { createReduxStore } from 'calypso/state';
import { addReducerToStore } from 'calypso/state/add-reducer';
import currentUser from 'calypso/state/current-user/reducer';
import {
	getInitialState,
	getStateFromCache,
	persistOnChange,
	MAX_AGE,
	SERIALIZE_THROTTLE,
} from 'calypso/state/initial-state';
import { loadPersistedState } from 'calypso/state/persisted-state';
import postTypes from 'calypso/state/post-types/reducer';
import reader from 'calypso/state/reader/reducer';
import signupReducer from 'calypso/state/signup/reducer';
import { combineReducers, withPersistence } from 'calypso/state/utils';

// Create a legacy initial reducer, with no modularization.
const initialReducer = combineReducers( {
	currentUser,
	postTypes,
} );

jest.mock( 'calypso/lib/user/support-user-interop', () => ( {
	isSupportSession: jest.fn().mockReturnValue( false ),
} ) );

describe( 'initial-state', () => {
	describe( 'getInitialState', () => {
		describe( 'retrieve persisted state from the cached client data', () => {
			describe( 'switched user', () => {
				describe( 'with recently persisted data and initial server data', () => {
					let state;
					let consoleErrorSpy;
					let getStoredItemSpy;

					const savedState = {
						'redux-state-123456789': {
							currentUser: { id: 123456789 },
							postTypes: {
								items: {
									2916284: {
										post: { name: 'post', label: 'Posts' },
										page: { name: 'page', label: 'Pages' },
									},
								},
							},
							_timestamp: Date.now(),
						},
					};

					beforeAll( async () => {
						isSupportSession.mockReturnValue( true );
						window.initialReduxState = { currentUser: { currencyCode: 'USD' } };
						consoleErrorSpy = jest.spyOn( global.console, 'error' );
						getStoredItemSpy = jest
							.spyOn( browserStorage, 'getAllStoredItems' )
							.mockResolvedValue( savedState );
						await loadPersistedState();
						state = getInitialState( initialReducer, 123456789 );
					} );

					afterAll( () => {
						isSupportSession.mockReturnValue( false );
						window.initialReduxState = null;
						consoleErrorSpy.mockRestore();
						getStoredItemSpy.mockRestore();
					} );

					test( 'builds initial state without errors', () => {
						expect( consoleErrorSpy ).not.toHaveBeenCalled();
					} );

					test( 'does not build initial state using IndexedDB state', () => {
						expect( state.postTypes ).toBeUndefined();
					} );

					test( 'does not add timestamp to initial state', () => {
						expect( state._timestamp ).toBeUndefined();
					} );

					test( 'does not build initial state using server state', () => {
						expect( state.currentUser ).toBeUndefined();
					} );
				} );
			} );

			describe( 'with recently persisted data and initial server data', () => {
				let state;
				let consoleErrorSpy;
				let getStoredItemSpy;

				const savedState = {
					'redux-state-123456789': {
						currentUser: { id: 123456789 },
						postTypes: {
							items: {
								2916284: {
									post: { name: 'post', label: 'Posts' },
									page: { name: 'page', label: 'Pages' },
								},
							},
						},
						_timestamp: Date.now(),
					},
				};

				const serverState = {
					postTypes: {
						items: {
							77203074: {
								post: { name: 'post', label: 'Posts' },
							},
						},
					},
				};

				beforeAll( async () => {
					window.initialReduxState = serverState;
					consoleErrorSpy = jest.spyOn( global.console, 'error' );
					getStoredItemSpy = jest
						.spyOn( browserStorage, 'getAllStoredItems' )
						.mockResolvedValue( savedState );
					await loadPersistedState();
					state = getInitialState( initialReducer, 123456789 );
				} );

				afterAll( () => {
					window.initialReduxState = null;
					consoleErrorSpy.mockRestore();
					getStoredItemSpy.mockRestore();
				} );

				test( 'builds initial state without errors', () => {
					expect( consoleErrorSpy ).not.toHaveBeenCalled();
				} );

				test( 'builds initial state using IndexedDB state', () => {
					expect( state.currentUser.id ).toBe( 123456789 );
				} );

				test( 'does not add timestamp to initial state', () => {
					expect( state._timestamp ).toBeUndefined();
				} );

				test( 'server state shallowly overrides IndexedDB state', () => {
					expect( state.postTypes.items ).toEqual( serverState.postTypes.items );
				} );
			} );

			describe( 'with stale persisted data and initial server data', () => {
				let state;
				let consoleErrorSpy;
				let getStoredItemSpy;

				const savedState = {
					'redux-state-123456789': {
						currentUser: { id: 123456789 },
						postTypes: {
							items: {
								2916284: {
									post: { name: 'post', label: 'Posts' },
									page: { name: 'page', label: 'Pages' },
								},
							},
						},
						_timestamp: Date.now() - MAX_AGE - 1,
					},
				};

				const serverState = {
					postTypes: {
						items: {
							77203074: {
								post: { name: 'post', label: 'Posts' },
							},
						},
					},
				};

				beforeAll( async () => {
					window.initialReduxState = serverState;
					consoleErrorSpy = jest.spyOn( global.console, 'error' );
					getStoredItemSpy = jest
						.spyOn( browserStorage, 'getAllStoredItems' )
						.mockResolvedValue( savedState );
					await loadPersistedState();
					state = getInitialState( initialReducer, 123456789 );
				} );

				afterAll( () => {
					window.initialReduxState = null;
					consoleErrorSpy.mockRestore();
					getStoredItemSpy.mockRestore();
				} );

				test( 'builds store without errors', () => {
					expect( consoleErrorSpy ).not.toHaveBeenCalled();
				} );

				test( 'builds initial state using server state', () => {
					expect( state.postTypes.items ).toEqual( serverState.postTypes.items );
				} );

				test( 'does not build initial state using IndexedDB state', () => {
					expect( state.currentUser ).toBeUndefined();
				} );

				test( 'does not add timestamp to store', () => {
					expect( state._timestamp ).toBeUndefined();
				} );
			} );

			describe( 'with recently persisted data and no initial server data', () => {
				let state;
				let consoleErrorSpy;
				let getStoredItemSpy;

				const savedState = {
					'redux-state-123456789': {
						currentUser: { id: 123456789 },
						postTypes: {
							items: {
								2916284: {
									post: { name: 'post', label: 'Posts' },
									page: { name: 'page', label: 'Pages' },
								},
							},
						},
						_timestamp: Date.now(),
					},
				};

				const serverState = {};

				beforeAll( async () => {
					window.initialReduxState = serverState;
					consoleErrorSpy = jest.spyOn( global.console, 'error' );
					getStoredItemSpy = jest
						.spyOn( browserStorage, 'getAllStoredItems' )
						.mockResolvedValue( savedState );
					await loadPersistedState();
					state = getInitialState( initialReducer, 123456789 );
				} );

				afterAll( () => {
					window.initialReduxState = null;
					consoleErrorSpy.mockRestore();
					getStoredItemSpy.mockRestore();
				} );

				test( 'builds initial state without errors', () => {
					expect( consoleErrorSpy ).not.toHaveBeenCalled();
				} );

				test( 'builds state using local forage state', () => {
					expect( state.currentUser.id ).toBe( 123456789 );
					expect( state.postTypes.items ).toEqual(
						savedState[ 'redux-state-123456789' ].postTypes.items
					);
				} );

				test( 'does not add timestamp to store', () => {
					expect( state._timestamp ).toBeUndefined();
				} );
			} );

			describe( 'with invalid persisted data and no initial server data', () => {
				let state;
				let consoleErrorSpy;
				let getStoredItemSpy;

				const userId = 123456789 + 1;
				const savedState = {
					[ `redux-state-${ userId }` ]: {
						// Create an invalid state by forcing the user ID
						// stored in the state to differ from the current
						// mocked user ID.
						currentUser: { id: userId },
						postTypes: {
							items: {
								2916284: {
									post: { name: 'post', label: 'Posts' },
									page: { name: 'page', label: 'Pages' },
								},
							},
						},
						_timestamp: Date.now(),
					},
				};

				const serverState = {};

				beforeAll( async () => {
					window.initialReduxState = serverState;
					consoleErrorSpy = jest.spyOn( global.console, 'error' );
					getStoredItemSpy = jest
						.spyOn( browserStorage, 'getAllStoredItems' )
						.mockResolvedValue( savedState );
					await loadPersistedState();
					state = getInitialState( initialReducer, 123456789 );
				} );

				afterAll( () => {
					window.initialReduxState = null;
					consoleErrorSpy.mockRestore();
					getStoredItemSpy.mockRestore();
				} );

				test( 'builds initial state without errors', () => {
					expect( consoleErrorSpy ).not.toHaveBeenCalled();
				} );

				test( 'does not build initial state using IndexedDB state', () => {
					expect( state.postTypes ).toBeUndefined();
				} );

				test( 'does not add timestamp to initial state', () => {
					expect( state._timestamp ).toBeUndefined();
				} );
			} );
		} );
	} );

	describe( 'getStateFromCache', () => {
		describe( 'with persisted data and no initial server data', () => {
			let state;
			let consoleErrorSpy;
			let getStoredItemSpy;

			const savedState = {
				'redux-state-123456789:reader': {
					organizations: { items: [ { id: 1, slug: 'saved' } ] },
					_timestamp: Date.now(),
				},
			};

			const serverState = null;

			beforeAll( async () => {
				window.initialReduxState = serverState;
				consoleErrorSpy = jest.spyOn( global.console, 'error' );
				getStoredItemSpy = jest
					.spyOn( browserStorage, 'getAllStoredItems' )
					.mockResolvedValue( savedState );
				await loadPersistedState();
				state = getStateFromCache( 123456789 )( reader, 'reader' );
			} );

			afterAll( () => {
				window.initialReduxState = null;
				consoleErrorSpy.mockRestore();
				getStoredItemSpy.mockRestore();
			} );

			test( 'builds initial state without errors', () => {
				expect( consoleErrorSpy ).not.toHaveBeenCalled();
			} );

			test( 'does not add timestamp to initial state', () => {
				expect( state._timestamp ).toBeUndefined();
			} );

			test( 'builds initial state using saved state', () => {
				expect( state.organizations.items ).toEqual( [ { id: 1, slug: 'saved' } ] );
			} );
		} );

		describe( 'with initial server data and no persisted data', () => {
			let state;
			let consoleErrorSpy;
			let getStoredItemSpy;

			const savedState = null;

			const serverState = {
				reader: {
					organizations: { items: [ { id: 2, slug: 'server' } ] },
				},
			};

			beforeAll( async () => {
				window.initialReduxState = serverState;
				consoleErrorSpy = jest.spyOn( global.console, 'error' );
				getStoredItemSpy = jest
					.spyOn( browserStorage, 'getAllStoredItems' )
					.mockResolvedValue( savedState );
				await loadPersistedState();
				state = getStateFromCache()( reader, 'reader' );
			} );

			afterAll( () => {
				window.initialReduxState = null;
				consoleErrorSpy.mockRestore();
				getStoredItemSpy.mockRestore();
			} );

			test( 'builds initial state without errors', () => {
				expect( consoleErrorSpy ).not.toHaveBeenCalled();
			} );

			test( 'does not add timestamp to initial state', () => {
				expect( state._timestamp ).toBeUndefined();
			} );

			test( 'builds initial state using server state', () => {
				expect( state.organizations.items ).toEqual( [ { id: 2, slug: 'server' } ] );
			} );
		} );

		describe( 'with fresher server data than persisted data', () => {
			let state;
			let consoleErrorSpy;
			let getStoredItemSpy;

			const oldDate = new Date();
			oldDate.setDate( oldDate.getDate() - 1 );

			const savedState = {
				'redux-state-123456789:reader': {
					organizations: { items: [ { id: 1, slug: 'saved' } ] },
					_timestamp: oldDate.getTime(),
				},
			};

			const serverState = {
				reader: {
					organizations: { items: [ { id: 2, slug: 'server' } ] },
				},
			};

			beforeAll( async () => {
				window.initialReduxState = serverState;
				consoleErrorSpy = jest.spyOn( global.console, 'error' );
				getStoredItemSpy = jest
					.spyOn( browserStorage, 'getAllStoredItems' )
					.mockResolvedValue( savedState );
				await loadPersistedState();
				state = getStateFromCache( 123456789 )( reader, 'reader' );
			} );

			afterAll( () => {
				window.initialReduxState = null;
				consoleErrorSpy.mockRestore();
				getStoredItemSpy.mockRestore();
			} );

			test( 'builds initial state without errors', () => {
				expect( consoleErrorSpy ).not.toHaveBeenCalled();
			} );

			test( 'does not add timestamp to initial state', () => {
				expect( state._timestamp ).toBeUndefined();
			} );

			test( 'builds initial state using server state', () => {
				expect( state.organizations.items ).toEqual( [ { id: 2, slug: 'server' } ] );
			} );
		} );

		describe( 'with fresher persisted data than server data', () => {
			let state;
			let consoleErrorSpy;
			let getStoredItemSpy;

			const newerDate = new Date();
			newerDate.setDate( newerDate.getDate() + 1 );

			const savedState = {
				'redux-state-123456789:reader': {
					organizations: { items: [ { id: 1, slug: 'saved' } ] },
					_timestamp: newerDate.getTime(),
				},
			};

			const serverState = {
				reader: {
					organizations: { items: [ { id: 2, slug: 'server' } ] },
				},
			};

			beforeAll( async () => {
				window.initialReduxState = serverState;
				consoleErrorSpy = jest.spyOn( global.console, 'error' );
				getStoredItemSpy = jest
					.spyOn( browserStorage, 'getAllStoredItems' )
					.mockResolvedValue( savedState );
				await loadPersistedState();
				state = getStateFromCache( 123456789 )( reader, 'reader' );
			} );

			afterAll( () => {
				window.initialReduxState = null;
				consoleErrorSpy.mockRestore();
				getStoredItemSpy.mockRestore();
			} );

			test( 'builds initial state without errors', () => {
				expect( consoleErrorSpy ).not.toHaveBeenCalled();
			} );

			test( 'does not add timestamp to initial state', () => {
				expect( state._timestamp ).toBeUndefined();
			} );

			test( 'builds initial state using saved state', () => {
				expect( state.organizations.items ).toEqual( [ { id: 1, slug: 'saved' } ] );
			} );
		} );

		describe( 'with empty persisted signup state for logged in user, and persisted state for logged out user', () => {
			let state;
			let consoleErrorSpy;
			let getStoredItemSpy;

			const _timestamp = Date.now();
			const storedState = {
				'redux-state-logged-out:signup': {
					dependencyStore: {
						siteType: 'blog',
						siteTitle: 'Logged out test title',
					},
					progress: {
						'logged-out-step': {
							stepName: 'logged-out-step',
							status: 'completed',
						},
					},
					_timestamp,
				},
			};
			const serverState = {};

			beforeAll( async () => {
				window.initialReduxState = serverState;
				consoleErrorSpy = jest.spyOn( global.console, 'error' );
				getStoredItemSpy = jest
					.spyOn( browserStorage, 'getAllStoredItems' )
					.mockResolvedValue( storedState );

				await loadPersistedState();
				state = getStateFromCache()( signupReducer, 'signup' );
			} );

			afterAll( () => {
				window.initialReduxState = null;
				consoleErrorSpy.mockRestore();
				getStoredItemSpy.mockRestore();
			} );

			test( 'builds initial state without errors', () => {
				expect( consoleErrorSpy ).not.toHaveBeenCalled();
			} );

			test( 'builds initial signup state from logged out state', () => {
				expect( state.dependencyStore ).toEqual(
					storedState[ 'redux-state-logged-out:signup' ].dependencyStore
				);
				expect( state.progress ).toEqual( storedState[ 'redux-state-logged-out:signup' ].progress );
			} );

			test( 'does not add timestamp to initial state', () => {
				expect( state._timestamp ).toBeUndefined();
			} );
		} );

		describe( 'with existing persisted signup state for logged in user, and persisted state for logged out user', () => {
			let state;
			let consoleErrorSpy;
			let getStoredItemSpy;

			const _timestamp = Date.now();
			const storedState = {
				'redux-state-123456789:signup': {
					dependencyStore: {
						siteType: 'blog',
						siteTitle: 'Logged in test title',
					},
					progress: {
						'logged-in-step': {
							stepName: 'logged-in-step',
							status: 'completed',
						},
					},
					_timestamp,
				},
				'redux-state-logged-out:signup': {
					dependencyStore: {
						siteType: 'blog',
						siteTitle: 'Logged out test title',
					},
					progress: {
						'logged-out-step': {
							stepName: 'logged-out-step',
							status: 'completed',
						},
					},
					_timestamp,
				},
			};
			const serverState = {};

			beforeAll( async () => {
				window.initialReduxState = serverState;
				consoleErrorSpy = jest.spyOn( global.console, 'error' );
				getStoredItemSpy = jest
					.spyOn( browserStorage, 'getAllStoredItems' )
					.mockResolvedValue( storedState );

				await loadPersistedState();
				state = getStateFromCache( 123456789 )( signupReducer, 'signup' );
			} );

			afterAll( () => {
				window.initialReduxState = null;
				consoleErrorSpy.mockRestore();
				getStoredItemSpy.mockRestore();
			} );

			test( 'builds initial state without errors', () => {
				expect( consoleErrorSpy ).not.toHaveBeenCalled();
			} );

			test( 'builds initial signup state from logged in state', () => {
				expect( state.dependencyStore ).toEqual(
					storedState[ 'redux-state-123456789:signup' ].dependencyStore
				);
				expect( state.progress ).toEqual( storedState[ 'redux-state-123456789:signup' ].progress );
			} );

			test( 'does not add timestamp to initial state', () => {
				expect( state._timestamp ).toBeUndefined();
			} );
		} );
	} );

	describe( '#persistOnChange()', () => {
		let store;
		let setStoredItemSpy;
		let stopPersisting;

		const dataReducer = withPersistence( ( state = null, { data } ) => {
			if ( data && data !== state ) {
				return data;
			}
			return state;
		} );

		const currentUserReducer = withPersistence( ( state = null, { userId } ) => {
			if ( userId && userId !== state.id ) {
				return { ...state, id: userId };
			}
			return state;
		} );

		const reducer = combineReducers( { data: dataReducer, currentUser: currentUserReducer } );

		// Create a valid initial state (with a stored user ID that matches the
		// current mocked user ID).
		const initialState = { currentUser: { id: 123456789 } };

		beforeEach( async () => {
			// we use fake timers from Sinon (aka Lolex) because `lodash.throttle` also uses `Date.now()`
			// and relies on it returning a mocked value. Jest fake timers don't mock `Date`, Lolex does.
			jest.useFakeTimers();
			setStoredItemSpy = jest
				.spyOn( browserStorage, 'setStoredItem' )
				.mockImplementation( ( value ) => Promise.resolve( value ) );

			store = createReduxStore( initialState, reducer );
			stopPersisting = persistOnChange( store, 123456789 );
		} );

		afterEach( () => {
			setStoredItemSpy.mockRestore();
		} );

		test( 'should persist state for first dispatch', () => {
			store.dispatch( {
				type: 'foo',
				data: 1,
			} );

			jest.advanceTimersByTime( SERIALIZE_THROTTLE );

			expect( setStoredItemSpy ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should persist state for changed state', () => {
			store.dispatch( {
				type: 'foo',
				data: 1,
			} );

			jest.advanceTimersByTime( SERIALIZE_THROTTLE );

			store.dispatch( {
				type: 'foo',
				data: 2,
			} );

			jest.advanceTimersByTime( SERIALIZE_THROTTLE );

			expect( setStoredItemSpy ).toHaveBeenCalledTimes( 2 );
		} );

		test( 'should not persist state for unchanged state', () => {
			store.dispatch( {
				type: 'foo',
				data: 1,
			} );

			jest.advanceTimersByTime( SERIALIZE_THROTTLE );

			store.dispatch( {
				type: 'foo',
				data: 1,
			} );

			jest.advanceTimersByTime( SERIALIZE_THROTTLE );

			expect( setStoredItemSpy ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'should throttle', () => {
			store.dispatch( {
				type: 'foo',
				data: 1,
			} );

			store.dispatch( {
				type: 'foo',
				data: 2,
			} );

			store.dispatch( {
				type: 'foo',
				data: 3,
			} );

			jest.advanceTimersByTime( SERIALIZE_THROTTLE );

			store.dispatch( {
				type: 'foo',
				data: 4,
			} );

			store.dispatch( {
				type: 'foo',
				data: 5,
			} );

			jest.advanceTimersByTime( SERIALIZE_THROTTLE );

			expect( setStoredItemSpy ).toHaveBeenCalledTimes( 2 );
			expect( setStoredItemSpy ).toHaveBeenCalledWith(
				'redux-state-123456789',
				expect.objectContaining( { data: 3 } )
			);
			expect( setStoredItemSpy ).toHaveBeenCalledWith(
				'redux-state-123456789',
				expect.objectContaining( { data: 5 } )
			);
		} );

		test( 'should not persist after calling the stop function', () => {
			store.dispatch( {
				type: 'foo',
				data: 1,
			} );
			jest.advanceTimersByTime( SERIALIZE_THROTTLE );
			expect( setStoredItemSpy ).toHaveBeenCalledTimes( 1 );

			stopPersisting();

			store.dispatch( {
				type: 'foo',
				data: 1,
			} );
			jest.advanceTimersByTime( SERIALIZE_THROTTLE );
			expect( setStoredItemSpy ).toHaveBeenCalledTimes( 1 ); // no new call
		} );
	} );
} );

describe( 'loading stored state with dynamic reducers', () => {
	// Creates a reducer that serializes objects by prefixing all keys with a given prefix.
	// For example, `withKeyPrefix( 'A' )` serializes `{ x: 1, y: 2 }` into `{ 'A:x': 1, 'A:y': 2 }`
	const withKeyPrefix = ( keyPrefix ) => {
		const keyPrefixRe = new RegExp( `^${ keyPrefix }:` );
		return withPersistence( ( state = {} ) => state, {
			serialize: ( state ) => mapKeys( state, ( value, key ) => `${ keyPrefix }:${ key }` ),
			deserialize: ( persisted ) =>
				mapKeys( persisted, ( value, key ) => key.replace( keyPrefixRe, '' ) ),
		} );
	};

	const currentUserReducer = withPersistence( ( state = { id: null } ) => state );

	let getStoredItemSpy;

	beforeEach( () => {
		// state stored in IndexedDB
		const _timestamp = Date.now();
		const storedState = {
			'redux-state-123456789': {
				currentUser: { id: 123456789 },
				_timestamp,
			},
			'redux-state-123456789:A': {
				'A:city': 'London',
				'A:country': 'UK',
				_timestamp,
			},
			'redux-state-123456789:B': {
				'B:city': 'Paris',
				'B:country': 'France',
				_timestamp,
			},
			'redux-state-123456789:CD': {
				'CD:city': 'Lisbon',
				'CD:country': 'Portugal',
				_timestamp,
			},
			'redux-state-123456789:E': {
				'E:city': 'Madrid',
				'E:country': 'Spain',
				_timestamp,
			},
		};

		// `lib/browser-storage` mock to return mock IndexedDB state
		getStoredItemSpy = jest
			.spyOn( browserStorage, 'getAllStoredItems' )
			.mockResolvedValue( storedState );
	} );

	afterEach( () => {
		getStoredItemSpy.mockRestore();
	} );

	test( 'loads state from multiple storage keys', async () => {
		// initial reducer. includes several subreducers with storageKey property
		const reducer = combineReducers( {
			currentUser: currentUserReducer,
			a: withStorageKey( 'A', withKeyPrefix( 'A' ) ),
			b: withStorageKey( 'B', withKeyPrefix( 'B' ) ),
		} );

		// load initial state and create Redux store with it
		await loadPersistedState();
		const state = getInitialState( reducer, 123456789 );
		const store = createReduxStore( state, reducer );

		// verify that state from all storageKey's was loaded
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
			a: {
				city: 'London',
				country: 'UK',
			},
			b: {
				city: 'Paris',
				country: 'France',
			},
		} );
	} );

	test( 'loads state after adding a reducer', async () => {
		// initial reducer. includes only the `currentUser` subreducer.
		const reducer = combineReducers( {
			currentUser: currentUserReducer,
		} );

		// load initial state and create Redux store with it
		await loadPersistedState();
		const userId = 123456789;
		const state = getInitialState( reducer, userId );
		const store = createReduxStore( state, reducer );

		// verify that the initial Redux store loaded state only for `currentUser`
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
		} );

		// load a reducer dynamically
		const aReducer = withStorageKey( 'A', withKeyPrefix( 'A' ) );
		addReducerToStore( store, getStateFromCache( userId ) )( [ 'a' ], aReducer );

		// verify that the Redux store contains the stored state for `A` now
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
			a: {
				city: 'London',
				country: 'UK',
			},
		} );
	} );

	test( 'loads state after adding a nested reducer', async () => {
		// initial reducer. includes only the `currentUser` subreducer.
		const reducer = combineReducers( {
			currentUser: currentUserReducer,
		} );

		// load initial state and create Redux store with it
		await loadPersistedState();
		const userId = 123456789;
		const state = getInitialState( reducer, userId );
		const store = createReduxStore( state, reducer );

		// verify that the initial Redux store loaded state only for `currentUser`
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
		} );

		// load a reducer dynamically
		const cdReducer = withStorageKey( 'CD', withKeyPrefix( 'CD' ) );
		addReducerToStore( store, getStateFromCache( userId ) )( [ 'c', 'd' ], cdReducer );

		// verify that the Redux store contains the stored state for `A` now
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
			c: {
				d: {
					city: 'Lisbon',
					country: 'Portugal',
				},
			},
		} );
	} );

	test( 'loads state a single time after adding a reducer twice', async () => {
		// initial reducer. includes only the `currentUser` subreducer.
		const reducer = combineReducers( {
			currentUser: currentUserReducer,
		} );

		// load initial state and create Redux store with it
		await loadPersistedState();
		const userId = 123456789;
		const state = getInitialState( reducer, userId );
		const store = createReduxStore( state, reducer );

		// verify that the initial Redux store loaded state only for `currentUser`
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
		} );

		// load a reducer dynamically
		const eReducer = withStorageKey( 'E', withKeyPrefix( 'E' ) );
		addReducerToStore( store, getStateFromCache( userId ) )( [ 'e' ], eReducer );
		addReducerToStore( store, getStateFromCache( userId ) )( [ 'e' ], eReducer );

		// verify that the Redux store contains the stored state for `E` now
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
			e: {
				city: 'Madrid',
				country: 'Spain',
			},
		} );
	} );

	test( 'throws an error when adding two different reducers to the same key', async () => {
		// initial reducer. includes only the `currentUser` subreducer.
		const reducer = combineReducers( {
			currentUser: currentUserReducer,
		} );

		// load initial state and create Redux store with it
		await loadPersistedState();
		const userId = 123456789;
		const state = getInitialState( reducer, userId );
		const store = createReduxStore( state, reducer );

		// verify that the initial Redux store loaded state only for `currentUser`
		expect( store.getState() ).toEqual( {
			currentUser: {
				id: 123456789,
			},
		} );

		// load a reducer dynamically
		const bReducer = withStorageKey( 'B', withKeyPrefix( 'B' ) );
		const cReducer = withStorageKey( 'C', withKeyPrefix( 'C' ) );

		expect( () => {
			addReducerToStore( store, getStateFromCache( userId ) )( [ 'b' ], bReducer );
			addReducerToStore( store, getStateFromCache( userId ) )( [ 'b' ], cReducer );
		} ).toThrow();
	} );
} );
