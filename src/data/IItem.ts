import type { IItemExport } from './IItemExport.js';

export interface IItem {
    export(): IItemExport;
}
