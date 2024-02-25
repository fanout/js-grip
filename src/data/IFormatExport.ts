type JsonSerializablePrimitive = null | boolean | string | number;
type JsonSerializableObject = { [key: string]: JSONSerializable };
type JSONSerializableArray = JSONSerializable[];
type JSONSerializable = JsonSerializablePrimitive | JsonSerializableObject | JSONSerializableArray;

export interface IFormatExport {
    [format: string]: JSONSerializable;
}
