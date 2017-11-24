#!/usr/bin/env node
"use strict";

import * as program from 'commander';
import {File}from './File';

import * as Ajv from "ajv";
import * as path from "path";

let filename = processCommandLine();
console.error("Beginning program...");

getFile(filename)
    .then(contents => {
        if (typeof contents === "string") {
            let data = JSON.parse(contents);
            validateSchema(data, path.resolve(__dirname, "..", "schema", "story.schema.03.json"));
        }
        console.error("Error given invalid data - Should totally fix in Typescript");
    }, error => {
        console.error(error);
    })
    .catch(error => {
        console.error(error);
    });

function validateSchema(data, schemaFile) {
    let dataToValidate = Object.assign({}, data);

    schemaFile = File.getFullFileName(schemaFile);
    let schema = File.readFileContents(schemaFile);

    let ajv = new Ajv();
    let valid = ajv.validate(JSON.parse(schema), dataToValidate);

    if (!valid) {
        throw ajv.errorsText();
    }

    return true;
}

function processCommandLine() {
    let fn = undefined;
    program
        .version('0.0.1')
        .arguments('<file>')
        .option('-s, --stdin', 'Read from STD_IN')
        .option('-o, --outfile [value]', 'Output to file rather than STD_OUT')
        .action(file => {
            fn = file;
        })
        .parse(process.argv);
    return fn;
}
function getFile(filename) {
    if (filename) {
        return getRealFile(filename);
    }
    return getStdIn();
}

function getRealFile(filename) {
    return new Promise((resolve, reject) => {
        try {
            filename = File.getFullFileName(filename);
        } catch (e) {
            reject(Error("Can't open file: " + filename));
        }

        if (!File.fileExistsAndIsReadable(filename)) {
            reject(Error("Can't open file: " + filename));
        }

        resolve(File.readFileContents(filename));
    });
}

function getStdIn() {

    if (!program.stdin) {
        program.help();
    }

    return new Promise((resolve, reject) => {
        let chunks = [];
        process.stdin.on('data', chunk => {
            chunks.push(chunk);
        });

        process.stdin.on('end', () => {
            resolve(chunks.join(''));
        });

        process.stdin.on('error', (err) => {
            reject(err);
        });
    });
}
