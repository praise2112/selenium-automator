export type DriverMethods = Array<DriverMethod>;

export type locators =
  | "xpath"
  | "className"
  | "css"
  | "id"
  | "js"
  | "linkText"
  | "name"
  | "partialLinkText"
  | "tagName";
export type elementActions =
  | "clear"
  | "click"
  | findElement
  | "submit"
  | sendKeys
  | "getText";
type until =
  | "elementLocated"
  | "elementsLocated"
  | "elementIsVisible"
  | "elementsIsSelected"
  | "elementIsNotVisible"
  | "elementIsNotSelected"
  | "elementIsDisabled"
  | "alertIsPresent"
  | "elementIsEnabled"
  | "stalenessOf";

interface get {
  url: string;
  newTab?: Boolean;
}

export interface sendKeys {
  action: "sendKeys";
  param: Array<string> | string;
}

export interface findElement {
  locator: locators;
  locatorParams: string;
  elementAction?: elementActions;
  until?: Array<until>;
  switchToIframe?: Boolean;
  index?: number;
}

export interface DriverMethod {
  get?: get;
  findElement?: findElement;
  findElements?: findElement;
  switchTabTo?: number;
  wait?: number;
  switchToDefaultContent: Boolean;
}
