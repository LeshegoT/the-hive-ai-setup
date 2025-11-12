import { Router }  from "express";
import { handle_errors } from '@the-hive/lib-core';
import { leaderboard } from '../../queries/leaderboard.queries';
import { getActiveDirectoryProfile, getProfilePicture } from '../../shared/active-directory-profile';

export const leaderboardRouter = Router();

const anonymous_picture_data =
  'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZpZXdCb3g9IjAgMCAyMCAyMCI+Cgk8Zz4KCQk8cGF0aCBkPSJNMjQgMEwyNCAyNEwwIDI0TDAgMEwyNCAwWiIgZmlsbD0ibm9uZSI+CgkJPC9wYXRoPgoJCTxwYXRoIGQ9Ik0xMi42NiAwLjM2TDEzLjg5IDAuNzlMMTUuMDUgMS4zN0wxNi4xMSAyLjA4TDE3LjA3IDIuOTNMMTcuOTIgMy44OUwxOC42MyA0Ljk1TDE5LjIxIDYuMTFMMTkuNjQgNy4zNEwxOS45MSA4LjY0TDIwIDEwTDE5LjkxIDExLjM2TDE5LjY0IDEyLjY2TDE5LjIxIDEzLjg5TDE4LjYzIDE1LjA1TDE3LjkyIDE2LjExTDE3LjA3IDE3LjA3TDE2LjExIDE3LjkyTDE1LjA1IDE4LjYzTDEzLjg5IDE5LjIxTDEyLjY2IDE5LjY0TDExLjM2IDE5LjkxTDEwIDIwTDguNjQgMTkuOTFMNy4zNCAxOS42NEw2LjExIDE5LjIxTDQuOTUgMTguNjNMMy44OSAxNy45MkwyLjkzIDE3LjA3TDIuMDggMTYuMTFMMS4zNyAxNS4wNUwwLjc5IDEzLjg5TDAuMzYgMTIuNjZMMC4wOSAxMS4zNkwwIDEwTDAuMDkgOC42NEwwLjM2IDcuMzRMMC43OSA2LjExTDEuMzcgNC45NUwyLjA4IDMuODlMMi45MyAyLjkzTDMuODkgMi4wOEw0Ljk1IDEuMzdMNi4xMSAwLjc5TDcuMzQgMC4zNkw4LjY0IDAuMDlMMTAgMEwxMS4zNiAwLjA5TDEyLjY2IDAuMzZaTTcuMDMgMTEuNDFMNS41NSAxMi4wNEw0LjQ0IDEyLjlMNCAxMy45OEw0Ljg4IDE1LjA2TDUuOTUgMTUuOTVMNy4xOCAxNi42M0w4LjU0IDE3LjA1TDEwIDE3LjJMMTEuNDYgMTcuMDVMMTIuODIgMTYuNjNMMTQuMDUgMTUuOTVMMTUuMTIgMTUuMDZMMTYgMTMuOThMMTUuNTYgMTIuOUwxNC40NSAxMi4wNEwxMi45NiAxMS40MUwxMS4zOSAxMS4wM0wxMCAxMC45TDguNjEgMTEuMDNMNy4wMyAxMS40MVpNNy44OCAzLjg4TDcuMjQgNC44M0w3IDZMNy4yNCA3LjE3TDcuODggOC4xMkw4LjgzIDguNzZMMTAgOUwxMS4xNyA4Ljc2TDEyLjEyIDguMTJMMTIuNzYgNy4xN0wxMyA2TDEyLjc2IDQuODNMMTIuMTIgMy44OEwxMS4xNyAzLjI0TDEwIDNMOC44MyAzLjI0TDcuODggMy44OFoiPgoJCTwvcGF0aD4KCTwvZz4KPC9zdmc+Cg==';

let top5 = undefined;

const loadTop5 = async () => {
  const entireLeaderboard = await leaderboard();

  top5 = [];

  for (const hero of entireLeaderboard.slice(0, 5)) {
    let displayName = hero.displayName,
      profilePictureData = anonymous_picture_data;

    if (!hero.appearAnonymously) {
      const profile = await getActiveDirectoryProfile(hero.userPrincipleName);
      displayName = profile.displayName;

      const profile_picture = await getProfilePicture(hero.userPrincipleName);
      profilePictureData = `data:image/png;base64,${profile_picture.toString(
        'base64'
      )}`;
    }

    top5.push({
      ...hero,
      displayName,
      profilePictureData,
    });
  }

  setTimeout(() => {
    top5 = undefined;
  }, 1 * 60 /*m*/ * 60 /*s*/ * 1000 /*ms*/);
};

leaderboardRouter.get(
  '/leaderboard',
  handle_errors(async (req, res) => {
    if (!top5) {
      await loadTop5();
    }

    res.json(top5);
  })
);
