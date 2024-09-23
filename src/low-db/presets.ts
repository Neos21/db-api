// https://github.com/typicode/lowdb/blob/1b004c8228029161a15b557ba0bb638eaad3fd4b/src/presets/node.ts
import { PathLike } from 'node:fs'

import { JSONFile, JSONFileSync } from './adapters-json-file'
import { Low, LowSync } from './core-low'

export async function JSONFilePreset<Data>(
  filename: PathLike,
  defaultData: Data,
): Promise<Low<Data>> {
  const adapter = new JSONFile<Data>(filename)
  const db = new Low<Data>(adapter, defaultData)
  await db.read()
  return db
}

export function JSONFileSyncPreset<Data>(
  filename: PathLike,
  defaultData: Data,
): LowSync<Data> {
  const adapter = new JSONFileSync<Data>(filename)
  const db = new LowSync<Data>(adapter, defaultData)
  db.read()
  return db
}
