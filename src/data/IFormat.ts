import IFormatExport from "./IFormatExport";

export default interface IFormat {
    name(): string;
    export(): IFormatExport;
}
