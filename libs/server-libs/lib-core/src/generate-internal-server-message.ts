import { configureAppInsights } from "./appinsights";
import { logger } from "./logger";

export function generateInternalServerMessage(context = "processing your request", error?:{message?:string}): { message: string } {
  if(configureAppInsights()){
    configureAppInsights().trackEvent({ name: "InternalServerError", properties: { context, error: error } });
  } else {
    logger.error("We are returning an error message to the user");
    logger.error(error);
  }
  return {
    message: `Technical issue encountered while ${context}. Please try again. If the issue persists, contact support.`
  };
}
