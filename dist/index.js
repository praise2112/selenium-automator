"use strict";
var _SeleniumAutomator_handleGet, _SeleniumAutomator_handleFindElementAction, _SeleniumAutomator_handleSwitchTabTo, _SeleniumAutomator_handleSwitchToDefaultContent, _SeleniumAutomator_handleWait, _SeleniumAutomator_handleDebugInfo;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeleniumAutomator = void 0;
const tslib_1 = require("tslib");
const selenium_webdriver_1 = require("selenium-webdriver");
const chalk_1 = tslib_1.__importDefault(require("chalk"));
chalk_1.default.level = 3;
const LOCATORS = [
    "xpath",
    "className",
    "css",
    "id",
    "js",
    "linkText",
    "name",
    "partialLinkText",
    "tagName",
];
const MODULE_NAME = "|SELENIUM AUTOMATOR|";
class SeleniumAutomator {
    constructor(driver, throwError = true, debug = false) {
        var _a;
        this.actions = [];
        this.canRun = false;
        _SeleniumAutomator_handleGet.set(this, (currentActionIndex) => {
            return async () => {
                const { newTab, url } = this.JSONActions[currentActionIndex]["get"];
                if (newTab) {
                    await this.driver.switchTo().newWindow("tab");
                }
                const _url = url.startsWith("http") ? url : `https://${url}`;
                await this.driver.get(_url);
                await this.driver.wait(() => {
                    return this.driver
                        .executeScript("return document.readyState")
                        .then((readyState) => {
                        return readyState === "complete";
                    });
                });
                tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Opened page ${_url} ${newTab ? "in a new tab." : "."}`);
            };
        });
        _SeleniumAutomator_handleFindElementAction.set(this, (currentActionIndex) => {
            const { locator, locatorParams, elementAction, until: _until = [], switchToIframe, index, } = this.JSONActions[currentActionIndex]["findElement"];
            /* Validate Index */
            if (index !== undefined && !SeleniumAutomator.isInt(index))
                SeleniumAutomator.handleError("Value of 'index' is not a number", JSON.stringify(this.JSONActions[currentActionIndex]["index"], null, 2));
            if (!locator || !locatorParams)
                SeleniumAutomator.handleError(`Field 'locator' and 'locatorParams' are requirement in 'findElement'`);
            if (!SeleniumAutomator.isArgTypeLocator(locator))
                SeleniumAutomator.handleError(`'FindElement' configuration is not valid. 'locator' must be one of ${JSON.stringify(LOCATORS)}. Got ${locator}`);
            return async () => {
                let elements;
                const elementLocator = selenium_webdriver_1.By[locator](locatorParams);
                /* utils functions that take locator*/
                for (let condition of _until) {
                    if (["elementLocated", "elementsLocated"].includes(condition))
                        await this.driver.wait(selenium_webdriver_1.until[condition](elementLocator));
                }
                /* If index is present find element else use find elements*/
                const isIndexValid = index !== undefined && SeleniumAutomator.isInt(index);
                if (isIndexValid) {
                    elements = await this.driver.findElements(elementLocator);
                }
                else {
                    /* Actually element not elements*/
                    elements = await this.driver.findElement(elementLocator);
                }
                /*If Index is added, validate if it actually exists*/
                if (isIndexValid && !elements[index])
                    SeleniumAutomator.handleError(`'index': ${index} does not exist in array of elements` +
                        JSON.stringify(elements, null, 2), JSON.stringify(this.JSONActions[currentActionIndex]["index"], null, 2));
                const element = elements[index] || elements;
                /* Switch to frame */
                if (switchToIframe) {
                    await this.driver.switchTo().frame(element);
                    tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Switched driver to iframe`);
                }
                /* until methods that take element as input*/
                for (let condition of _until) {
                    if ([
                        "elementIsVisible",
                        "elementsIsSelected",
                        "elementIsNotVisible",
                        "elementIsNotSelected",
                        "elementIsDisabled",
                        "alertIsPresent",
                        "elementIsEnabled",
                        "stalenessOf",
                    ].includes(condition))
                        await this.driver.wait(selenium_webdriver_1.until[condition](element));
                }
                if (elementAction) {
                    await SeleniumAutomator.handleElementAction(elementAction, element);
                }
                tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Executed find element successfully \n ${JSON.stringify(this.JSONActions[currentActionIndex], null, 2)}`);
            };
        });
        _SeleniumAutomator_handleSwitchTabTo.set(this, (currentActionIndex) => {
            return async () => {
                const tabNumber = this.JSONActions[currentActionIndex]["switchTabTo"];
                const windows = await this.driver.getAllWindowHandles();
                if (!SeleniumAutomator.isInt(tabNumber) || !windows[tabNumber])
                    SeleniumAutomator.handleError("Value of 'switchTabTo' is not a number or tab index doesn't exists", JSON.stringify(this.JSONActions[currentActionIndex]["switchTabTo"], null, 2));
                await this.driver.switchTo().window(windows[tabNumber]);
                tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Switch tab to index ${tabNumber} successfully`);
            };
        });
        _SeleniumAutomator_handleSwitchToDefaultContent.set(this, (currentActionIndex) => {
            return async () => {
                if (this.JSONActions[currentActionIndex]["switchToDefaultContent"]) {
                    await this.driver.switchTo().defaultContent();
                    tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Switched driver to default content successfully`);
                }
            };
        });
        _SeleniumAutomator_handleWait.set(this, (currentActionIndex) => {
            if (!SeleniumAutomator.isFloat(this.JSONActions[currentActionIndex]["wait"]))
                SeleniumAutomator.handleError("Value of 'wait' is not a number", JSON.stringify(this.JSONActions[currentActionIndex]["wait"], null, 2));
            return async () => {
                const time = this.JSONActions[currentActionIndex]["wait"];
                await SeleniumAutomator.timeout(time * 1000);
                tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Waited for ${time} seconds`);
            };
        });
        _SeleniumAutomator_handleDebugInfo.set(this, (info) => {
            if (this.debug) {
                console.log(chalk_1.default.bold.blue(`${MODULE_NAME}[DEBUG]: \n`) + chalk_1.default.gray(info));
            }
        });
        if (((_a = driver === null || driver === void 0 ? void 0 : driver.constructor) === null || _a === void 0 ? void 0 : _a.name) !== "thenableWebDriverProxy")
            SeleniumAutomator.handleError("Driver must be of type 'thenableWebDriverProxy'");
        this.driver = driver;
        this.throwError = throwError;
        this.debug = debug;
    }
    buildAutomator(actions) {
        this.JSONActions = actions;
        let currentActionIndex;
        let currentKeyIndex;
        try {
            actions.forEach((action, index) => {
                currentActionIndex = index;
                const keys = Object.keys(action);
                const actionFunctions = [];
                keys.forEach((key) => {
                    currentKeyIndex = key;
                    switch (key) {
                        case "get": {
                            actionFunctions.push(tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleGet, "f").call(this, currentActionIndex));
                            return;
                        }
                        case "findElement": {
                            actionFunctions.push(tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleFindElementAction, "f").call(this, currentActionIndex));
                            return;
                        }
                        case "switchTabTo": {
                            actionFunctions.push(tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleSwitchTabTo, "f").call(this, currentActionIndex));
                            return;
                        }
                        case "switchToDefaultContent": {
                            actionFunctions.push(tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleSwitchToDefaultContent, "f").call(this, currentActionIndex));
                            return;
                        }
                        case "wait": {
                            actionFunctions.push(tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleWait, "f").call(this, currentActionIndex));
                            return;
                        }
                        default:
                            return;
                    }
                });
                this.actions.push(actionFunctions);
            });
            this.canRun = true;
            tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Built automator successfully`);
            return { success: true, error: "", cause: "" };
        }
        catch (e) {
            if (this.throwError) {
                SeleniumAutomator.handleError(e, chalk_1.default.blue(`AN ERROR OCCURRED WHEN BUILDING AUTOMATOR \n OCCURRED FROM: \n`) +
                    JSON.stringify(this.JSONActions[currentActionIndex][currentKeyIndex], null, 2));
            }
            else {
                return {
                    success: false,
                    cause: this.JSONActions[currentActionIndex][currentKeyIndex],
                    error: e,
                };
            }
        }
    }
    async runAutomator() {
        if (this.canRun) {
            let currentActionIndex = 0;
            try {
                for (let i = 0; i < this.actions.length; i++) {
                    currentActionIndex = i;
                    for (let j = 0; j < this.actions[i].length; j++) {
                        await this.actions[i][j]();
                    }
                }
                tslib_1.__classPrivateFieldGet(this, _SeleniumAutomator_handleDebugInfo, "f").call(this, `Ran automator successfully`);
                return { success: true, error: "", cause: "" };
            }
            catch (e) {
                if (this.throwError) {
                    SeleniumAutomator.handleError(e, chalk_1.default.blue(`AN ERROR OCCURRED WHEN RUNNING AUTOMATOR \n OCCURRED FROM: \n`) + JSON.stringify(this.JSONActions[currentActionIndex], null, 2));
                }
                else {
                    return {
                        success: false,
                        cause: this.JSONActions[currentActionIndex],
                        error: e,
                    };
                }
            }
        }
    }
}
exports.SeleniumAutomator = SeleniumAutomator;
_SeleniumAutomator_handleGet = new WeakMap(), _SeleniumAutomator_handleFindElementAction = new WeakMap(), _SeleniumAutomator_handleSwitchTabTo = new WeakMap(), _SeleniumAutomator_handleSwitchToDefaultContent = new WeakMap(), _SeleniumAutomator_handleWait = new WeakMap(), _SeleniumAutomator_handleDebugInfo = new WeakMap();
SeleniumAutomator.handleError = (error, title = "", _throw = true) => {
    if (_throw) {
        throw new Error(chalk_1.default.bold.blue(`${MODULE_NAME} \n`) +
            chalk_1.default.red(title) +
            "\n" +
            chalk_1.default.red(error));
    }
    else
        console.log(chalk_1.default.bold.blue(`${MODULE_NAME} \n`) +
            chalk_1.default.red(title) +
            "\n" +
            chalk_1.default.red(error));
};
SeleniumAutomator.handleElementAction = async (action, element) => {
    if (["click", "submit", "clear"].includes(action)) {
        return await element[action]();
    }
    if ((action === null || action === void 0 ? void 0 : action.action) === "sendKeys") {
        return await element[action.action](action.param);
    }
    if (["getText"].includes(action)) {
        const text = await element[action]();
        console.log(chalk_1.default.bold.blue(`${MODULE_NAME} '${action}'\n`) + chalk_1.default.green(text));
    }
};
SeleniumAutomator.timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
SeleniumAutomator.isInt = (value) => {
    return (!isNaN(value) &&
        parseInt(String(Number(value))) == value &&
        !isNaN(parseInt(value, 10)));
};
SeleniumAutomator.isFloat = (value) => {
    return (!isNaN(value) &&
        parseFloat(String(Number(value))) == value &&
        !isNaN(parseFloat(value)));
};
SeleniumAutomator.isArgTypeLocator = (arg) => {
    return LOCATORS.some((element) => element === arg);
};
