'use client'
import { useEffect } from 'react'
//functions to access and upodate the virtual DOM(fiber tree) programmatically

/**
 * A hook to add and remove classes from a component's class list.
 *
 * The hook takes an object with three properties:
 * - componentRef: A React ref to the component.
 * - classesToRemove: An optional string or array of strings. If present, the
 *   classes will be removed from the component's class list.
 * - classesToAdd: An optional string or array of strings. If present, the
 *   classes will be added to the component's class list.
 *
 * The hook runs on mount and whenever the properties change.
 */
export function useClassListHandler({ componentRef, classesToRemove, classesToAdd }) {
  useEffect(() => {
    if (componentRef.current) {
      if (classesToRemove) {
        componentRef.classList.remove(classesToRemove)
      }
      if (!classesToAdd) return

      componentRef.classList.add(classesToAdd)
    }
  }, [])
}

/**
 * A hook to add and remove classes from a custom table's scroll area container.
 *
 * The hook takes an object with three properties:
 * - tableRef: A React ref to the table component.
 * - classesToRemove: An optional string or array of strings. If present, the
 *   classes will be removed from the table's scroll area container's class list.
 * - classesToAdd: An optional string or array of strings. If present, the
 *   classes will be added to the table's scroll area container's class list.
 *
 * The hook runs on mount and whenever the properties change.
 */
export function useCustomTableHandler({ tableRef, classesToRemove, classesToAdd }) {
  useEffect(() => {
    if (tableRef.current) {
      const scrollArea = tableRef.current.parentElement.parentElement.parentElement.children[1]

      if (classesToRemove) {
        scrollArea.parentElement.classList.remove(classesToRemove)
      }

      if (!classesToAdd) return

      scrollArea.parentElement.classList.add(classesToAdd)
    }
  }, [])
}
