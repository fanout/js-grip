declare module 'jspack' {
    export const jspack: {
        Unpack(format: string, data: number[], offset?: number): number[];
        Pack(format: string, data: number[]): number[] | false;
    };
}
