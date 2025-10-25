import { WebDriver } from 'selenium-webdriver';
import { IAutomationFlow, FlowConfig, FlowResult } from '../types/types';
export declare abstract class BaseFlow implements IAutomationFlow {
    protected config: FlowConfig;
    protected driver: WebDriver | null;
    protected status: 'idle' | 'running' | 'completed' | 'error';
    protected results: FlowResult | null;
    constructor(config: FlowConfig);
    initialize(driver: WebDriver): void;
    abstract execute(): Promise<FlowResult>;
    cleanup(): Promise<void>;
    getStatus(): 'idle' | 'running' | 'completed' | 'error';
    getResults(): FlowResult | null;
    protected executeWithRetry<T>(operation: () => Promise<T>, operationName: string): Promise<T>;
    protected waitForDelay(): Promise<void>;
}
//# sourceMappingURL=BaseFlow.d.ts.map