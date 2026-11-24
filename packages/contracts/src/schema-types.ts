/** Public DTOs expose schema keys while loose wire objects retain unknown fields. */
export type KnownFields<T> = T extends (infer Item)[]
  ? KnownFields<Item>[]
  : T extends readonly (infer Item)[]
    ? readonly KnownFields<Item>[]
    : T extends object
      ? {
          [
            Key in keyof T as string extends Key ? never : number extends Key ? never : Key
          ]: KnownFields<T[Key]>;
        }
      : T;
