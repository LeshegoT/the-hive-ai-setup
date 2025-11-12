/**
 *
 * Module containing functions related to html-templates for e-mails (and other)
 * non-browser HTML rendering.
 *
 * Possible future features for this file would include loading templates from
 * Azure Storage Containers instead of the file system, or even from the database.
 *
 * @module shared/html-template
 */

const Handlebars = require('handlebars');
const fs = require('fs');

/**
 * Prepare a template for use in HTML generation.
 * This is just an alias for the {@see Handlebars#compile} method
 *
 * @param {string} input the input string to compile into a Handlebars template
 * @param {CompileOptions} [options] handlebars compile options
 */
const prepareTemplate = Handlebars.compile;

/**
 * Load template file from file system synchronously
 * @param {string} folder the folder name in the server's working directory to load the file from
 * @param {string} fileName the filename in the specified folder
 * @returns the loaded file as a string to be compiled by the Handlebars template engine.
 */
const loadTemplateFile = (folder, fileName) =>
  fs.readFileSync(`${__dirname}/${folder}/${fileName}`, 'utf8');

/**
 * Load template file from file system synchronously and prepare
 * @param {string} folder the folder name in the server's working directory to load the file from
 * @param {string} fileName the filename in the specified folder
 * @returns {HandlebarsTemplateDelegate} the loaded file as a compiled handlebars template
 */
const prepareTemplateFromFile = (folder, fileName) =>
  prepareTemplate(loadTemplateFile(folder, fileName));

module.exports = {
  prepareTemplate,
  prepareTemplateFromFile,
};
