import { IFormatExport } from './IFormatExport.js';

export interface IFormat {
    name(): string;
    export(): IFormatExport;
}
