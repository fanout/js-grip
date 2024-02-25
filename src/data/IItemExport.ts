import type { IFormatExport } from './IFormatExport.js';

export interface IItemExport {
    channel?: string;
    id?: string;
    'prev-id'?: string;
    formats: Record<string, IFormatExport>;
}
