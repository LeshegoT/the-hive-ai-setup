const router = require('express').Router();
const fetch = require('node-fetch');
const { handle_errors } = require('@the-hive/lib-core');
const { buildErrorObject } = require('../shared/error-handling');
const {
  findFeedbackTagsWithoutRatingPrediction,
  findFeedbackWithoutSentimentPrediction,
  storeFeedbackTagPrediction,
  storeFeedbackSentimentPrediction,
} = require('../queries/peer-feedback.queries');
const queue = require('../shared/queue');

const feedbackPredictionVersion = process.env.FEEDBACK_PREDICTION_VERION || 1;
const feedbackPredictionURL = `${process.env.FEEDBACK_PREDICTION_BASE}/v1/models`;

const predictTag = async (detail) => {
  if (detail.text) {
    const modelName = detail.tagName.split(' ')[0].toLowerCase();
    const url = `${feedbackPredictionURL}/${modelName}_model:predict`;
    const body = JSON.stringify({ instances: [detail.text] });
    const result = await fetch(url, {
      body,
      method: 'POST',
    });

    return result.json();
  } else {
    // tags without text cannot be used, excluded in query, but added here to be safe
    return undefined;
  }
};

const predictSentiment = async (detail) => {
  if (detail.text) {
    const url = `${feedbackPredictionURL}/sentiment_model:predict`;
    const body = JSON.stringify({ instances: [detail.text] });
    const result = await fetch(url, {
      body,
      method: 'POST',
    });

    return result.json();
  } else {
    // tags without text cannot be used, excluded in query, but added here to be safe
    return undefined;
  }
};

router.post(
  '/feedback-sentiment-prediction',
  handle_errors(async (req, res) => {
    try {
      const item = req.body;
      const result = await predictSentiment(item);
      if (result) {
        await storeFeedbackSentimentPrediction(
          item,
          feedbackPredictionVersion,
          result.predictions[0]
        );
        res.json({ updated: item.messageId });
      } else {
        res.status(500).json({ error: 'Item had no text' });
      }
    } catch (error) {
      res.status(500).send(JSON.stringify(buildErrorObject(error)));
    }
  })
);

router.post(
  '/feedback-without-prediction',
  handle_errors(async (_req, res) => {
    try {
      const feedbackMissingPredictions =
        await findFeedbackWithoutSentimentPrediction(feedbackPredictionVersion);
      for (const item of feedbackMissingPredictions) {
        await queue.enqueue('feedback-sentiment-prediction-queue', item);
      }
      res.json({
        queued: `${feedbackMissingPredictions.length} messages for sentiment prediction`,
      });
    } catch (error) {
      res.status(500).send(JSON.stringify(buildErrorObject(error)));
    }
  })
);

router.post(
  '/feedback-tag-rating-prediction',
  handle_errors(async (req, res) => {
    try {
      const item = req.body;
      const result = await predictTag(item);
      if (result) {
        await storeFeedbackTagPrediction(
          item,
          feedbackPredictionVersion,
          result.predictions[0]
        );
        res.json({ updated: item.feedbackTagId });
      } else {
        res.status(500).json({ error: 'Item had no text' });
      }
    } catch (error) {
      res.status(500).send(JSON.stringify(buildErrorObject(error)));
    }
  })
);

router.post(
  '/feedback-tags-without-prediction',
  handle_errors(async (_req, res) => {
    try {
      const feedbackTagsMissingPredictions =
        await findFeedbackTagsWithoutRatingPrediction(
          feedbackPredictionVersion
        );
      for (const item of feedbackTagsMissingPredictions) {
        await queue.enqueue('feedback-tag-rating-prediction-queue', item);
      }
      res.json({
        queued: `${feedbackTagsMissingPredictions.length} tags for prediction`,
      });
    } catch (error) {
      res.status(500).send(JSON.stringify(buildErrorObject(error)));
    }
  })
);

module.exports = router;
