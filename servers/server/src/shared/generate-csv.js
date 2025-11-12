const generateCsv = (headers, data, info = []) => {
  let csv = '';

  if (info.length) {
    for (const inf of info) {
      if (Array.isArray(inf)) {
        csv += inf.join(',');
        csv += '\r\n';
      } else {
        csv += `${inf}\r\n`;
      }
    }
    csv += '\r\n';
  }

  csv += headers.join(',');
  csv += `\r\n`;

  for (const row of data) {
    csv += row.join(',');
    csv += `\r\n`;
  }

  return csv;
};

module.exports = { generateCsv };
