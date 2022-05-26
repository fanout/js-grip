import { IFormatExport } from './IFormatExport';

export interface IFormat {
    name(): string;
    export(): IFormatExport;
}
