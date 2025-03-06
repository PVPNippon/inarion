'use client'
import { useEffect } from 'react'
//functions to access and upodate the virtual DOM(fiber tree) programmatically

/**
 * A hook to add and remove classes from a React component in a programmatic way.
 *
 * The hook takes an object with three properties:
 * - componentRef: A React ref to the component.
 * - classesToRemove: A string or an array of strings of classes to remove from the component.
 * - classesToAdd: A string or an array of strings of classes to add to the component.
 *
 * The hook will remove the specified classes from the component and add the classes specified in the classesToAdd property.
 *
 * The hook will only work if the componentRef is not null and the component is mounted.
 */
export function useClassListHandler({ componentRef, classesToRemove, classesToAdd }) {
  if (componentRef.current) {
    if (classesToRemove) {
      componentRef.current.classList.remove(classesToRemove)
    }
    if (!classesToAdd) return

    componentRef.current.classList.add(classesToAdd)
  }
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
