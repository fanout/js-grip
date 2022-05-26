export interface IItemExport {
    channel?: string;
    id?: string;
    'prev-id'?: string;
    formats: { [format: string]: object };
}
