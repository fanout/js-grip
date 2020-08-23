export default interface IItemExport {
    channel?: string;
    id?: string;
    'prev-id'?: string;
    [format: string]: any;
}
