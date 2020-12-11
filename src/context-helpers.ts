/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConstructNode } from '@aws-cdk/core'

export const getContextByNamespace = (namespace: string): any => {
  const allContext = JSON.parse(process.env.CDK_CONTEXT_JSON ?? '{}')
  const result: any = {}
  const prefix = `${namespace}`
  for (const [key, value] of Object.entries(allContext)) {
    if (key.startsWith(prefix)) {
      const flattenedKey = key.substr(prefix.length)
      result[flattenedKey] = value
    }
  }
  return result
}

export const getRequiredContext = (node: ConstructNode, key: string): any => {
  const value = node.tryGetContext(key)
  if (value === undefined || value === null) {
    throw new Error(`Context key '${key}' is required.`)
  }
  return value
}
