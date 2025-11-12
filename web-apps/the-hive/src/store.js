/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { createStore, compose, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';

import { app } from './reducers/app.reducer';
import { tracks } from './reducers/tracks.reducer';
import { courses } from './reducers/courses.reducer';
import { sections } from './reducers/sections.reducer';
import { heroes } from './reducers/heroes.reducer';
import { referenceData } from './reducers/reference-data.reducer';
import { quests } from './reducers/quests.reducer';
import { avatar } from './reducers/avatar.reducer';
import { messages } from './reducers/messages.reducer';
import { questEditor } from './reducers/quest-editor.reducer';
import { sideQuests } from './reducers/side-quests.reducer';
import { leaderboard } from './reducers/leaderboard.reducer';
import { learningTasks } from './reducers/learning-tasks.reducer';
import { settings } from './reducers/settings.reducer';
import { levelUps } from './reducers/level-ups.reducer';
import { levelUpActivities } from './reducers/level-up-activities.reducer';
import { levelUpUsers } from './reducers/level-up-users.reducer';
import { notifications } from './reducers/notifications.reducer';
import { questions } from './reducers/questions.reducer';
import { map } from './reducers/map.reducer';
import { votingOptions, userVotes, votingEvent, votingActiveEvents } from './reducers/voting.reducer';
import { syndicateFormationDetails, syndicateFormations } from './reducers/syndicate.reducer';
import { multiplier } from './reducers/multiplier.reducer';
import { points } from './reducers/points.reducer';
import { announcement } from './reducers/announcement.reducer';
import { stock, cart, purchaseState, pickupLocations, balance, orderHistory, stockSortOrder } from './reducers/store.reducer';
import { easterEgg } from './reducers/easter-egg.reducer';
import { peerFeedback } from './reducers/peer-feedback.reducer';
import { progressBar } from './reducers/progress-bar.reducer';
import { content } from './reducers/content.reducer';
import { ratings } from './reducers/ratings.reducer';
import { tags } from './reducers/tags.reducer';
import { speech } from './reducers/speech.reducer';
import { raffle } from './reducers/raffle.reducer';
import { review } from './reducers/review.reducer';
import { guideApplications } from './reducers/new-guide.reducer';
import { survey } from './reducers/survey.reducer';

// Sets up a Chrome extension for time travel debugging.
// See https://github.com/zalmoxisus/redux-devtools-extension for more information.
const devCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// Initializes the Redux store with a lazyReducerEnhancer (so that you can
// lazily add reducers after the store has been created) and redux-thunk (so
// that you can dispatch async actions). See the "Redux and state management"
// section of the wiki for more details:
// https://github.com/Polymer/pwa-starter-kit/wiki/4.-Redux-and-state-management
export const store = createStore(
  (state) => state,
  devCompose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk))
);

// Initially loaded reducers.
store.addReducers({
  app,
  tracks,
  courses,
  sections,
  heroes,
  referenceData,
  quests,
  avatar,
  messages,
  questEditor,
  sideQuests,
  leaderboard,
  learningTasks,
  settings,
  levelUps,
  levelUpActivities,
  levelUpUsers,
  notifications,
  questions,
  map,
  votingOptions,
  votingActiveEvents,
  userVotes,
  votingEvent,
  syndicateFormationDetails,
  syndicateFormations,
  multiplier,
  points,
  announcement,
  stock,
  cart,
  purchaseState,
  pickupLocations,
  balance,
  orderHistory,
  stockSortOrder,
  easterEgg,
  peerFeedback,
  progressBar,
  content,
  ratings,
  tags,
  speech,
  raffle,
  review,
  guideApplications,
  survey
});
