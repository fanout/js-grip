import { IFormat } from './IFormat.js';
import { IFormatExport } from './IFormatExport.js';

// The Format class is provided as a base class for all publishing
// formats that are included in the Item class. Examples of format
// implementations include JsonObjectFormat and HttpStreamFormat.

// In pure TypeScript this would not be needed (implementations would
// only need to implement IFormat), but since this needs to be consumable
// from JavaScript, we are exporting this class.

export abstract class Format implements IFormat {
    // The name of the format which should return a string. Examples
    // include 'json-object' and 'http-response'
    abstract name(): string;
    // The export method which should return a format-specific hash
    // containing the required format-specific data.
    abstract export(): IFormatExport;
}
