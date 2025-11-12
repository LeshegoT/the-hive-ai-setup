const { db } = require('../shared/db');
const fixCase = require('../shared/fix-case');
const dockerNames = require('docker-names');

const anonymous_picture_data =
  'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHZpZXdCb3g9IjAgMCAyMCAyMCI+Cgk8ZyBmaWxsPSJyZ2IoMTUwLCAxNTAsIDE1MCkiPgoJCTxwYXRoIGQ9Ik0yNCAwTDI0IDI0TDAgMjRMMCAwTDI0IDBaIiBmaWxsPSJub25lIj4KCQk8L3BhdGg+CgkJPHBhdGggZD0iTTEyLjY2IDAuMzZMMTMuODkgMC43OUwxNS4wNSAxLjM3TDE2LjExIDIuMDhMMTcuMDcgMi45M0wxNy45MiAzLjg5TDE4LjYzIDQuOTVMMTkuMjEgNi4xMUwxOS42NCA3LjM0TDE5LjkxIDguNjRMMjAgMTBMMTkuOTEgMTEuMzZMMTkuNjQgMTIuNjZMMTkuMjEgMTMuODlMMTguNjMgMTUuMDVMMTcuOTIgMTYuMTFMMTcuMDcgMTcuMDdMMTYuMTEgMTcuOTJMMTUuMDUgMTguNjNMMTMuODkgMTkuMjFMMTIuNjYgMTkuNjRMMTEuMzYgMTkuOTFMMTAgMjBMOC42NCAxOS45MUw3LjM0IDE5LjY0TDYuMTEgMTkuMjFMNC45NSAxOC42M0wzLjg5IDE3LjkyTDIuOTMgMTcuMDdMMi4wOCAxNi4xMUwxLjM3IDE1LjA1TDAuNzkgMTMuODlMMC4zNiAxMi42NkwwLjA5IDExLjM2TDAgMTBMMC4wOSA4LjY0TDAuMzYgNy4zNEwwLjc5IDYuMTFMMS4zNyA0Ljk1TDIuMDggMy44OUwyLjkzIDIuOTNMMy44OSAyLjA4TDQuOTUgMS4zN0w2LjExIDAuNzlMNy4zNCAwLjM2TDguNjQgMC4wOUwxMCAwTDExLjM2IDAuMDlMMTIuNjYgMC4zNlpNNy4wMyAxMS40MUw1LjU1IDEyLjA0TDQuNDQgMTIuOUw0IDEzLjk4TDQuODggMTUuMDZMNS45NSAxNS45NUw3LjE4IDE2LjYzTDguNTQgMTcuMDVMMTAgMTcuMkwxMS40NiAxNy4wNUwxMi44MiAxNi42M0wxNC4wNSAxNS45NUwxNS4xMiAxNS4wNkwxNiAxMy45OEwxNS41NiAxMi45TDE0LjQ1IDEyLjA0TDEyLjk2IDExLjQxTDExLjM5IDExLjAzTDEwIDEwLjlMOC42MSAxMS4wM0w3LjAzIDExLjQxWk03Ljg4IDMuODhMNy4yNCA0LjgzTDcgNkw3LjI0IDcuMTdMNy44OCA4LjEyTDguODMgOC43NkwxMCA5TDExLjE3IDguNzZMMTIuMTIgOC4xMkwxMi43NiA3LjE3TDEzIDZMMTIuNzYgNC44M0wxMi4xMiAzLjg4TDExLjE3IDMuMjRMMTAgM0w4LjgzIDMuMjRMNy44OCAzLjg4WiI+CgkJPC9wYXRoPgoJPC9nPgo8L3N2Zz4K';

const groupParts = (heroes, upn) => {
  const working = heroes.reduce((group, current) => {
    const appearAnonymously = current.appearAnonymously !== '0';
    const displayName = appearAnonymously
      ? dockerNames.getRandomName().replace('_', ' ')
      : current.userPrincipleName;
    const profilePictureData = appearAnonymously && anonymous_picture_data;

    const hero = group[current.userPrincipleName] || {
      userPrincipleName:
        upn == current.userPrincipleName
          ? current.userPrincipleName
          : displayName,
      displayName,
      position: current.position,
      pointsTotal: current.pointsTotal,
      realName: current.realName,
      avatar: {
        red: current.red,
        green: current.green,
        blue: current.blue,
        level: {
          levelId: current.levelId,
          code: current.levelCode,
        },
      },
      parts: {},
      lastRanking: {
        lastPosition: current.lastPosition,
        lastPoints: current.lastPoints,
      },
      appearAnonymously,
      profilePictureData,
    };

    if (current.partId) {
      hero.parts[current.partType] = {
        partId: current.partId,
        partCode: current.partCode,
        svgPath: current.svgPath,
      };
    }

    group[current.userPrincipleName] = hero;

    return group;
  }, {});

  return Object.values(working);
};

const leaderboard = async (upn) => {
  // TODO: Should we page this dataset?
  const q = `
      with Leaderboard (Position, UserPrincipleName, PointsTotal, LastActive)  
      as  
      (  
        select 
            ROW_NUMBER() over(order by PointsTotal desc) as Position,
            p.UserPrincipleName,
            p.PointsTotal,
            p.LastHeroActivityDate
        from Profiles p
            INNER JOIN Staff s ON s.UserPrincipleName = p.UserPrincipleName
        WHERE s.StaffStatus = 'active'
      ) 

      select
        l.Position,
        l.UserPrincipleName,
        l.PointsTotal,
        a.Red,
        a.Green,
        a.Blue,
        a.LevelId,
        le.Code as LevelCode,
        p.PartId,
        p.Code as PartCode,
        p.PartType,
        p.SvgPath,
        s.DisplayName as RealName,
        ppr.RankPosition as LastPosition,
        ppr.RankPoints as LastPoints,
        isnull(us.Value, 0) as AppearAnonymously
      from Leaderboard l
        left join Avatars a 
          on a.UPN = l.UserPrincipleName
        left join Staff s
          on s.UserPrincipleName = l.UserPrincipleName
        left join Levels le
          on a.levelId = le.levelId       
        left outer join AvatarParts ap 
          on ap.AvatarId = a.AvatarId
          and ap.Active = 1
        left outer join Parts p
          on p.PartId = ap.PartId
          and a.LevelId = p.LevelId
        left outer join PastProfileRankings ppr
          on ppr.UserPrincipleName = l.UserPrincipleName
          and ppr.CreatedDate > DATEADD(month, -1, GETDATE())
          and ppr.CreatedDate < GETDATE()
        left outer join UserSettings us
          on l.UserPrincipleName = us.UserPrincipleName
          and us.Code = 'appear-anonymously'
        where l.PointsTotal > 0 
      order by l.Position, l.LastActive desc
    `;

  const connection = await db();
  const results = await connection.timed_query(q, 'leaderboard');

  const heroes = groupParts(fixCase(results.recordset), upn);
  return heroes;
};

const toRank = async () => {
  const q = `
      with Leaderboard (Position, UserPrincipleName, PointsTotal)  
      as  
      (  
        select 
            ROW_NUMBER() over(order by PointsTotal desc) as Position,
            p.UserPrincipleName,
            p.PointsTotal
        from Profiles p
      ) 

      select
        l.Position,
        l.UserPrincipleName,
        l.PointsTotal
      from Leaderboard l
    `;

  const connection = await db();
  const results = await connection.timed_query(q, 'toRank');

  const heroes = fixCase(results.recordset);
  return heroes;
};

module.exports = {
  leaderboard,
  toRank,
};
