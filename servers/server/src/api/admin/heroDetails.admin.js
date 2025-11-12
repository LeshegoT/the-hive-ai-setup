const router = require('express').Router();
const { handle_errors } = require('@the-hive/lib-core');
const { guide_specialisations } = require('../../queries/guide.queries');

const { hero_details } = require('../../queries/hero.queries');
const { updateQuestsGuide } = require('../../queries/quest.queries');
const { withTransaction } = require('../../shared/db');

router.get(
  '/heroDetails',
  handle_errors(async (req, res) => {
    const details = await hero_details(req.query.upn);

    res.json(details);
  })
);

router.patch(
  '/hero/:heroUserPrincipleName/reassign-guide',
  handle_errors(async (req, res) => {
    const heroUserPrincipleName = req.params.heroUserPrincipleName;
    const { guideUserPrincipleName } = req.body;

    try {
      const guideSpecialisations = await guide_specialisations(
        guideUserPrincipleName,
        'active'
      );
      const hero = await hero_details(heroUserPrincipleName);

      await withTransaction(async (tx) => {
        if (hero !== undefined) {
          const guideHasHeroSpecialisation = guideSpecialisations.some(
            (specialisation) => specialisation.name === hero.specialisation
          );

          if (guideHasHeroSpecialisation) {
            await updateQuestsGuide(
              tx,
              heroUserPrincipleName,
              guideUserPrincipleName,
              'in-progress'
            );
          } else {
            throw new Error(
              `Cannot reassign hero '${heroUserPrincipleName}' to guide '${guideUserPrincipleName}' because the guide doesn't have the hero's specialisation.`
            );
          }
        } else {
          throw new Error(
            `The hero '${heroUserPrincipleName}' does not exist.`
          );
        }
      });
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  })
);

module.exports = router;
