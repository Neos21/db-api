// https://github.com/typicode/lowdb/blob/1b004c8228029161a15b557ba0bb638eaad3fd4b/src/adapters/node/JSONFile.ts
import { PathLike } from 'node:fs'

import { DataFile, DataFileSync } from './adapters-data-file'

export class JSONFile<T> extends DataFile<T> {
  constructor(filename: PathLike) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data: T) => JSON.stringify(data, null, 2),
    })
  }
}

export class JSONFileSync<T> extends DataFileSync<T> {
  constructor(filename: PathLike) {
    super(filename, {
      parse: JSON.parse,
      stringify: (data: T) => JSON.stringify(data, null, 2),
    })
  }
}