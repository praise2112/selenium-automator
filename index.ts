import { By, until } from "selenium-webdriver";
import chalk from "chalk";
import { DriverMethods, locators } from "./types";

chalk.level = 3;

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

export class SeleniumAutomator {
  public driver: any;
  private readonly debug: Boolean;
  private readonly throwError: Boolean;
  private actions: Array<Array<Function>> = [];
  private JSONActions: DriverMethods | undefined;
  private canRun: Boolean = false;

  constructor(driver: any, throwError = true, debug = false) {
    if (driver?.constructor?.name !== "thenableWebDriverProxy")
      SeleniumAutomator.handleError(
        "Driver must be of type 'thenableWebDriverProxy'"
      );
    this.driver = driver;
    this.throwError = throwError;
    this.debug = debug;
  }

  buildAutomator(actions: DriverMethods): Object | void {
    this.JSONActions = actions;
    let currentActionIndex: number;
    let currentKeyIndex: string;
    try {
      actions.forEach((action, index) => {
        currentActionIndex = index;
        const keys = Object.keys(action);
        const actionFunctions: Function[] = [];
        keys.forEach((key) => {
          currentKeyIndex = key;
          switch (key) {
            case "get": {
              actionFunctions.push(this.#handleGet(currentActionIndex));
              return;
            }
            case "findElement": {
              actionFunctions.push(
                <Function>this.#handleFindElementAction(currentActionIndex)
              );
              return;
            }
            case "switchTabTo": {
              actionFunctions.push(this.#handleSwitchTabTo(currentActionIndex));
              return;
            }
            case "switchToDefaultContent": {
              actionFunctions.push(
                this.#handleSwitchToDefaultContent(currentActionIndex)
              );
              return;
            }
            case "wait": {
              actionFunctions.push(this.#handleWait(currentActionIndex));
              return;
            }
            default:
              return;
          }
        });
        this.actions.push(actionFunctions);
      });
      this.canRun = true;
      this.#handleDebugInfo(`Built automator successfully`);
      return { success: true, error: "", cause: "" };
    } catch (e) {
      if (this.throwError) {
        SeleniumAutomator.handleError(
          e,
          chalk.blue(
            `AN ERROR OCCURRED WHEN BUILDING AUTOMATOR \n OCCURRED FROM: \n`
          ) +
            JSON.stringify(
              this.JSONActions[currentActionIndex][currentKeyIndex],
              null,
              2
            )
        );
      } else {
        return {
          success: false,
          cause: this.JSONActions[currentActionIndex][currentKeyIndex],
          error: e,
        };
      }
    }
  }

  async runAutomator(): Promise<Object | void> {
    if (this.canRun) {
      let currentActionIndex: number = 0;
      try {
        for (let i = 0; i < this.actions.length; i++) {
          currentActionIndex = i;
          for (let j = 0; j < this.actions[i].length; j++) {
            await this.actions[i][j]();
          }
        }
        this.#handleDebugInfo(`Ran automator successfully`);
        return { success: true, error: "", cause: "" };
      } catch (e) {
        if (this.throwError) {
          SeleniumAutomator.handleError(
            e,
            chalk.blue(
              `AN ERROR OCCURRED WHEN RUNNING AUTOMATOR \n OCCURRED FROM: \n`
            ) + JSON.stringify(this.JSONActions[currentActionIndex], null, 2)
          );
        } else {
          return {
            success: false,
            cause: this.JSONActions[currentActionIndex],
            error: e,
          };
        }
      }
    }
  }

  #handleGet = (currentActionIndex): Function => {
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
      this.#handleDebugInfo(
        `Opened page ${_url} ${newTab ? "in a new tab." : "."}`
      );
    };
  };

  #handleFindElementAction = (currentActionIndex): Function | void => {
    const {
      locator,
      locatorParams,
      elementAction,
      until: _until = [],
      switchToIframe,
      index,
    } = this.JSONActions[currentActionIndex]["findElement"];
    /* Validate Index */
    if (index !== undefined && !SeleniumAutomator.isInt(index))
      SeleniumAutomator.handleError(
        "Value of 'index' is not a number",
        JSON.stringify(this.JSONActions[currentActionIndex]["index"], null, 2)
      );
    if (!locator || !locatorParams)
      SeleniumAutomator.handleError(
        `Field 'locator' and 'locatorParams' are requirement in 'findElement'`
      );
    if (!SeleniumAutomator.isArgTypeLocator(locator))
      SeleniumAutomator.handleError(
        `'FindElement' configuration is not valid. 'locator' must be one of ${JSON.stringify(
          LOCATORS
        )}. Got ${locator}`
      );

    return async () => {
      let elements;
      const elementLocator = By[locator](locatorParams);
      /* utils functions that take locator*/
      for (let condition of _until) {
        if (["elementLocated", "elementsLocated"].includes(condition))
          await this.driver.wait(until[condition](elementLocator));
      }
      /* If index is present find element else use find elements*/
      const isIndexValid =
        index !== undefined && SeleniumAutomator.isInt(index);
      if (isIndexValid) {
        elements = await this.driver.findElements(elementLocator);
      } else {
        /* Actually element not elements*/
        elements = await this.driver.findElement(elementLocator);
      }
      /*If Index is added, validate if it actually exists*/
      if (isIndexValid && !elements[index])
        SeleniumAutomator.handleError(
          `'index': ${index} does not exist in array of elements` +
            JSON.stringify(elements, null, 2),
          JSON.stringify(this.JSONActions[currentActionIndex]["index"], null, 2)
        );
      const element = elements[index] || elements;
      /* Switch to frame */
      if (switchToIframe) {
        await this.driver.switchTo().frame(element);
        this.#handleDebugInfo(`Switched driver to iframe`);
      }
      /* until methods that take element as input*/
      for (let condition of _until) {
        if (
          [
            "elementIsVisible",
            "elementsIsSelected",
            "elementIsNotVisible",
            "elementIsNotSelected",
            "elementIsDisabled",
            "alertIsPresent",
            "elementIsEnabled",
            "stalenessOf",
          ].includes(condition)
        )
          await this.driver.wait(until[condition](element));
      }
      if (elementAction) {
        await SeleniumAutomator.handleElementAction(elementAction, element);
      }
      this.#handleDebugInfo(
        `Executed find element successfully \n ${JSON.stringify(
          this.JSONActions[currentActionIndex],
          null,
          2
        )}`
      );
    };
  };

  #handleSwitchTabTo = (currentActionIndex): Function => {
    return async () => {
      const tabNumber = this.JSONActions[currentActionIndex]["switchTabTo"];
      const windows = await this.driver.getAllWindowHandles();
      if (!SeleniumAutomator.isInt(tabNumber) || !windows[tabNumber])
        SeleniumAutomator.handleError(
          "Value of 'switchTabTo' is not a number or tab index doesn't exists",
          JSON.stringify(
            this.JSONActions[currentActionIndex]["switchTabTo"],
            null,
            2
          )
        );
      await this.driver.switchTo().window(windows[tabNumber]);
      this.#handleDebugInfo(`Switch tab to index ${tabNumber} successfully`);
    };
  };

  #handleSwitchToDefaultContent = (currentActionIndex): Function => {
    return async () => {
      if (this.JSONActions[currentActionIndex]["switchToDefaultContent"]) {
        await this.driver.switchTo().defaultContent();
        this.#handleDebugInfo(
          `Switched driver to default content successfully`
        );
      }
    };
  };

  #handleWait = (currentActionIndex): Function => {
    if (
      !SeleniumAutomator.isFloat(this.JSONActions[currentActionIndex]["wait"])
    )
      SeleniumAutomator.handleError(
        "Value of 'wait' is not a number",
        JSON.stringify(this.JSONActions[currentActionIndex]["wait"], null, 2)
      );
    return async () => {
      const time: number = this.JSONActions[currentActionIndex]["wait"];
      await SeleniumAutomator.timeout(time * 1000);
      this.#handleDebugInfo(`Waited for ${time} seconds`);
    };
  };

  #handleDebugInfo = (info: string) => {
    if (this.debug) {
      console.log(
        chalk.bold.blue(`${MODULE_NAME}[DEBUG]: \n`) + chalk.gray(info)
      );
    }
  };

  static handleError = (error, title = "", _throw = true) => {
    if (_throw) {
      throw new Error(
        chalk.bold.blue(`${MODULE_NAME} \n`) +
          chalk.red(title) +
          "\n" +
          chalk.red(error)
      );
    } else
      console.log(
        chalk.bold.blue(`${MODULE_NAME} \n`) +
          chalk.red(title) +
          "\n" +
          chalk.red(error)
      );
  };

  static handleElementAction = async (action, element) => {
    if (["click", "submit", "clear"].includes(action)) {
      return await element[action]();
    }
    if (action?.action === "sendKeys") {
      return await element[action.action](action.param);
    }
    if (["getText"].includes(action)) {
      const text = await element[action]();
      console.log(
        chalk.bold.blue(`${MODULE_NAME} '${action}'\n`) + chalk.green(text)
      );
    }
  };

  static timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  static isInt = (value) => {
    return (
      !isNaN(value) &&
      parseInt(String(Number(value))) == value &&
      !isNaN(parseInt(value, 10))
    );
  };
  static isFloat = (value) => {
    return (
      !isNaN(value) &&
      parseFloat(String(Number(value))) == value &&
      !isNaN(parseFloat(value))
    );
  };
  static isArgTypeLocator = (arg: locators): arg is locators => {
    return LOCATORS.some((element) => element === arg);
  };
}
