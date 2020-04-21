declare module 'jspack' {
    export const jspack: {
        Unpack(format: string, data: number[], offset?: number): any;
        Pack(format: string, data: any): number[] | false;
    };
}