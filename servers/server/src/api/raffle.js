const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { withTransaction } = require('../shared/db');
const { award_bucks } = require('../queries/rewards.queries');
const {
  retrieveUserParticipantRaffles,
  retrieveRaffleParticipants,
  updateParticpantEntries,
  updateRaffleStatus,
  retrieveRaffle,
  updateRaffleWinner,
  retrieveRaffleRewardReason,
  updateRaffleSpinDate,
} = require('../queries/raffle.queries');

const { get_spend_balance } = require('../queries/store.queries');

const { parseIfSetElseDefault } = require('@the-hive/lib-core');

const rafflePrice = parseIfSetElseDefault('RAFFLE_ENTRY_COST', 10);

// router.post(
//   '/raffle',
//   handle_errors(async (req, res) => {
//      let { description, spinDate , participants } = req.body;
//      const openRaffleStatusId = 1;

//      try{

//       await withTransaction(async (tx) => {
//         let raffleId = await createRaffle(tx, description, res.locals.upn, openRaffleStatusId, spinDate);

//         for(let participant of participants){
//             await addParticipantToRaffle(tx, participant, raffleId);
//         }
//       });

//       res.status(201).send();

//     }catch(error){
//       console.log(error)
//       res.status(400).send('Failed to create Raffle');
//     }

//   })
// );

// router.post(
//   '/raffle/participant/',
//   handle_errors(async (req, res) => {
//      let {raffleId , participant} = req.body;

//     try {
//       await withTransaction(async (tx) => { await addParticipantToRaffle(tx, participant, raffleId);   });

//       let raffles = await retrieveRaffle(raffleId);
//       let data = await structuredData(raffles);
//       res.json(data[0]);

//     } catch (error) {
//       res.status(400).send('Failed to create Raffle');
//     }
//   })
// );

router.get(
  '/raffles',
  handle_errors(async (req, res) => {
    await maintainRafflesStates();
    const raffles = await retrieveUserParticipantRaffles(res.locals.upn);
    const data = await structuredData(raffles);
    res.json(data);
  })
);

router.get(
  '/raffle/:id',
  handle_errors(async (req, res) => {
    await maintainRafflesStates();
    const raffles = await retrieveRaffle(req.params.id);
    const data = await structuredData(raffles);

    res.json(data[0]);
  })
);

router.get(
  '/raffle/:id/winner/',
  handle_errors(async (req, res) => {
    const raffleId = req.params.id;

    const participants = (await retrieveRaffleParticipants(raffleId)).filter(
      (participant) => participant.entries != 0
    );
    const winningAmount = participants.reduce((accumulator, participant) => {
      return accumulator + participant.bucksSpent;
    }, 0);

    //for each participant entry make entry in array
    const participantEntries = participants
      .map((participant) => {
        return [...new Array(participant.entries)].map(() => {
          return {
            raffleParticipantId: participant.raffleParticipantId,
            participant: participant.participant,
            participantName: participant.displayName,
            sort: Math.random(),
          };
        });
      })
      .flat()
      .sort((a, b) => a.sort - b.sort);

    //generate random index winner
    const max = participantEntries.length - 1;
    const randomWinnerEntryIndex = Math.floor(Math.random() * (max - 0 + 1) + 0);
    const winner = participantEntries[randomWinnerEntryIndex];

    try {
      //update db with winner
      const reasonId = await retrieveRaffleRewardReason();

      await withTransaction(async (tx) => {
        const awardId = await award_bucks(
          tx,
          winningAmount,
          winner.participant,
          'system',
          reasonId.rewardReasonId
        );
        await updateRaffleWinner(tx, winner.raffleParticipantId, awardId);
      });

      await maintainRafflesStates();

      //return participant names and winner ID
      const data = {
        winner: participants.findIndex(
          (participant) => participant.participant == winner.participant
        ),
        participants: participants.map(
          (participant) => participant.displayName
        ),
        total: winningAmount,
      };

      res.json(data);
    } catch (error) {
      res.status(400).json({message:'Failed to determine raffle winner', error});
    }
  })
);

router.patch(
  '/raffle/:id/postpone',
  handle_errors(async (req, res) => {
    try {
      const upn = res.locals.upn;
      const raffleId = req.params.id;
      const spinDate = req.body.spinDate;

      await updateRaffleSpinDate(raffleId, spinDate, upn);
      await maintainRafflesStates();
      res.status(201).send();
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

const maintainRafflesStates = async () => {
  await withTransaction(async (tx) => {
    await updateRaffleStatus(tx);
  });
};

const structuredData = async (raffles) => {
  const participants = await participantsOfRaffles(raffles);
  const data = await structuredRafflesData(raffles, participants);
  return data;
};

const structuredRafflesData = async (raffles, participants) => {
  return raffles.map((raffle) => {
    return {
      raffleId: raffle.raffleId,
      description: raffle.description,
      createdBy: raffle.createdBy,
      status: {
        name: raffle.status,
        description: raffle.statusDescription,
      },
      spinDate: raffle.spinDate,
      participants: participants[raffle.raffleId],
      totalWinningsAvailable: participants[raffle.raffleId]
        .map((participant) => participant.bucksSpent)
        .reduce((prev, next) => prev + next),
    };
  });
};

const participantsOfRaffles = async (raffles) => {
  const participants = [];

  for (let i = 0; i < raffles.length; i++) {
    const raffleParticipants = await retrieveRaffleParticipants(
      raffles[i].raffleId
    );

    participants[raffles[i].raffleId] = raffleParticipants.map(
      (participant) => {
        return {
          raffleParticipantId: participant.raffleParticipantId,
          winner: participant.winner,
          userPrincipleName: participant.participant,
          displayName: participant.displayName,
          entries: participant.entries,
          bucksSpent: participant.bucksSpent,
        };
      }
    );
  }

  return participants;
};

router.post(
  '/raffle/participant/:id/',
  handle_errors(async (req, res) => {
    try {
      const upn = res.locals.upn;
      const spend = await get_spend_balance(upn);
      const entries = req.body.entries;

      if (!entries || entries <= 0) {
        throw 'Invalid entry amount';
      }

      const raffleParticipantId = req.params.id;
      const entryBucksCost = rafflePrice * entries;
      if (entryBucksCost > spend.balance) {
        return res
          .status(400)
          .json(
            `Insufficient balance! Raffle entry total of ${entryBucksCost} is higher than user balance of ${spend.balance}.`
          );
      } else {
        await updateParticpantEntries(
          entries,
          entryBucksCost,
          raffleParticipantId,
          upn
        );
        res.status(201).send();
      }
    } catch (error) {
      res.status(400).send(error);
    }
  })
);

router.get(
  '/raffles/price',
  handle_errors(async (req, res) => {
    const data = {
      price: rafflePrice,
    };

    res.json(data);
  })
);

module.exports = router;
