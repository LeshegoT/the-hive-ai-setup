import { fetchBinaryBlobData, getEnvironmentName, parseIfSetElseDefault } from "@the-hive/lib-core";
import { bioTemplateStrategySa, bioTemplateStrategyIndia, bioTemplateStrategyNl } from "./bio-document-strategies";

export const BioTemplateName = {
  SA: "South African Bio",
  NL: "Netherlands Bio",
  INDIA: "India Bio",
}

export const BioTemplates = {
  [BioTemplateName.SA]: bioTemplateStrategySa,
  [BioTemplateName.INDIA]: bioTemplateStrategyIndia,
  [BioTemplateName.NL]: bioTemplateStrategyNl,
}


export const getBioTemplateFromAzure = async (bioTemplateFileName: string): Promise<Buffer> => {
  const bioContainer = parseIfSetElseDefault("AZURE_BIO_TEMPLATES_STORAGE_CONTAINER", "bio-templates");
  const azureTemplatePath = `${getEnvironmentName(true)}/${bioTemplateFileName}`

  try {
    const templateBuffer = await fetchBinaryBlobData(bioContainer, azureTemplatePath);
    return templateBuffer
  } catch (error) {
    if (error.statusCode === 404) {
      throw new Error(`Azure bio template not found. Container: ${bioContainer}, Template: ${azureTemplatePath}`);
    }
    throw error;
  }
}