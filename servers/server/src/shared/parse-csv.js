const fixcase = require('./fix-case');
const { logger } = require('@the-hive/lib-core');

const parseCsvWithDelimiter = (csv, delimiter='') => {
  const lines = csv.replaceAll("\r\n","\n")
                 .split("\n")
                 .map(line => line.replace(/,,/g, `,${delimiter}${delimiter},`));
  logger.info('Lines %d', lines.length);


  const headers = lines[0].replace(/\s/g, "")
                        .split(`${delimiter},${delimiter}`)
                        .map(hLine => delimiter.length>0 ? hLine.replace(delimiter, ""):hLine); 
  logger.info('Headers %d: %s',headers.length, headers);
  
  const result = [];
  const brokenRows = [];
  for (let i = 1; i < lines.length; i++) {
    // ignore empty lines (such as the last line of most files)
    if (lines[i].trim().length>0) {
      const obj = {};
      const currentLine = lines[i].split(`${delimiter},${delimiter}`);
      if (currentLine.length !== headers.length){
        const message = `CSV columns do not match headers for row ${i}`;
        logger.warn(message);
        brokenRows.push(message);
      } else {
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentLine[j].trim();
          obj['originalLineNumber'] = i;
        }
        result.push(obj);
      }
    }
  }

  return {result: fixcase(result), errors: brokenRows}; 
}


const parseCsv = (csv) => {
  //let csv is the CSV file with headers
  const lines = csv.replace(/"/g, '').replaceAll("\r\n","\n").split("\n");
  logger.info('Lines %d', lines.length);
  const result = [];
  const brokenRows = [];

  // TODO: RE - I hate this special header handling :(
  const headers = lines[0].replace(/\s/g, "").split(",").map(header => header.replace(/\//g,"")); 
  logger.info("Headers %d: %s",headers.length, headers);

  for (let i = 1; i < lines.length; i++) {
    // ignore empty lines (such as the last line of most files)
    if (lines[i].trim().length>0) {
      const obj = {};
      const currentLine = lines[i].split(",");
      if (currentLine.length !== headers.length){
        const message = `CSV columns do not match headers for row ${i}`;
        logger.warn(message);
        brokenRows.push(message);
      } else {
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentLine[j].trim();
          obj['originalLineNumber'] = i;
        }
        result.push(obj);
      }
    }
  }

  return {result: fixcase(result), errors: brokenRows}; 
}

module.exports = { parseCsv, parseCsvWithDelimiter };
