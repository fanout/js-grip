declare module 'jspack' {
    export const jspack: {
        Unpack(format: string, data: Array<number>, offset?: number): any;
        Pack(format: string, data: any): Array<number> | false;
    };
}