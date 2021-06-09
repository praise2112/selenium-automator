import { DriverMethods, locators } from "./types";
export declare class SeleniumAutomator {
    #private;
    driver: any;
    private readonly debug;
    private readonly throwError;
    private actions;
    private JSONActions;
    private canRun;
    constructor(driver: any, throwError?: boolean, debug?: boolean);
    buildAutomator(actions: DriverMethods): Object | void;
    runAutomator(): Promise<Object | void>;
    static handleError: (error: any, title?: string, _throw?: boolean) => void;
    static handleElementAction: (action: any, element: any) => Promise<any>;
    static timeout: (ms: any) => Promise<unknown>;
    static isInt: (value: any) => boolean;
    static isFloat: (value: any) => boolean;
    static isArgTypeLocator: (arg: locators) => arg is locators;
}
