// https://github.com/typicode/lowdb/blob/1b004c8228029161a15b557ba0bb638eaad3fd4b/src/adapters/node/DataFile.ts
import { PathLike } from 'fs'

import { Adapter, SyncAdapter } from './core-low'
import { TextFile, TextFileSync } from './adapters-text-file'

export class DataFile<T> implements Adapter<T> {
  #adapter: TextFile
  #parse: (str: string) => T
  #stringify: (data: T) => string
  
  constructor(
    filename: PathLike,
    {
      parse,
      stringify,
    }: {
      parse: (str: string) => T
      stringify: (data: T) => string
    },
  ) {
    this.#adapter = new TextFile(filename)
    this.#parse = parse
    this.#stringify = stringify
  }
  
  async read(): Promise<T | null> {
    const data = await this.#adapter.read()
    if (data === null) {
      return null
    } else {
      return this.#parse(data)
    }
  }
  
  write(obj: T): Promise<void> {
    return this.#adapter.write(this.#stringify(obj))
  }
}

export class DataFileSync<T> implements SyncAdapter<T> {
  #adapter: TextFileSync
  #parse: (str: string) => T
  #stringify: (data: T) => string
  
  constructor(
    filename: PathLike,
    {
      parse,
      stringify,
    }: {
      parse: (str: string) => T
      stringify: (data: T) => string
    },
  ) {
    this.#adapter = new TextFileSync(filename)
    this.#parse = parse
    this.#stringify = stringify
  }
  
  read(): T | null {
    const data = this.#adapter.read()
    if (data === null) {
      return null
    } else {
      return this.#parse(data)
    }
  }
  
  write(obj: T): void {
    this.#adapter.write(this.#stringify(obj))
  }
}
