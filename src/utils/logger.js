/**
 * MONGOOSE VERSION
 * @author Joris Dugué
 * @link https://sekarion.tk
 * @licence http://www.gnu.org/licenses/gpl.txt GNU GPL v3
 * @copyright Copyright (c) 2019 Joris Dugué
 **/
const chalk = require('chalk');
const sleep = require('./sleep');
require('draftlog').into(console);
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
/**
 * @prop {Map} drafts
 **/
class Log {
    constructor() {
        this.drafts = new Map();
    }
    /**
     * @param {*} load
     * @param {Boolean} returnString
     * @returns {void}
     **/
    loading(load, returnString) {
        const log = `[${chalk.magenta(Date().toString().split(' ').slice(1, 5).join(' '))}] ${load}`;
        if (returnString) {
            return log;
        } else {
            console.log(log);
        }
    }
    /**
     * @param {*} cmd
     * @param {Boolean} returnString
     * @returns {void}
     **/
    cmds(cmd, returnString) {
        const log = `[${chalk.cyan(Date().toString().split(' ').slice(1, 5).join(' '))}] ${cmd}`;
        if (returnString) {
            return log;
        } else {
            console.log(log);
        }
    }
    /**
     * @param {*} err
     * @param {Boolean} returnString
     * @returns {void}
     **/
    error(err, returnString) {
        const log = `[${chalk.red(Date().toString().split(' ').slice(1, 5).join(' '))}] ${err}`;
        if (returnString) {
            return log;
        } else {
            console.log(log);
        }
    }
    /**
     * @param {*} warning
     * @param {Boolean} returnString
     * @returns {void}
     **/
    warning(warning, returnString) {
        const log = `[${chalk.yellow(Date().toString().split(' ').slice(1, 5).join(' '))}] ${warning}`;
        if (returnString) {
            return log;
        } else {
            console.log(log);
        }
    }
    info(info, returnString) {
        const log = `[${chalk.green(Date().toString().split(' ').slice(1, 5).join(' '))}] ${info}`;
        if (returnString) {
            return log;
        } else {
            console.log(log);
        }
    }
    /**
     * @param {String|Number} name
     * @param {*} text
     * @returns {void}
     **/
    async draft(name, text) {
        if (!process.stderr.isTTY) {
            return this.info(text);
        }
        this.drafts.set(name, {
            spinning: true,
            text,
            draft: console.draft(this.info(`${frames[0]} ${text}`, true))
        });
        for (let i = 0; this.drafts.get(name).spinning; i++) {
            await sleep(50);
            this.drafts.get(name).draft(this.info(`${frames[i % frames.length]} ${text}`, true))
        }
    }
    /**
     * @param {String|Number} name
     * @param {*}
     * @param {Boolean} [succeed = true]
     * @returns {void}
     **/
    async endDraft(name, text, succeed = true) {
        this.drafts.get(name).spinning = false;
        await sleep(50);
        this.drafts.get(name).draft(this[succeed ? 'info' : 'error'](`${succeed ? '✔' : '✖'} ${text}`, true));
        this.drafts.delete(name);
    }
}
module.exports = new Log();