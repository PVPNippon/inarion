'use client'
import { useEffect } from 'react'
//functions to access and upodate the virtual DOM(fiber tree) programmatically

/**
 * A function that takes a component reference and two optional parameters, classesToRemove and classesToAdd.
 * It removes the classesToRemove from the component's class list and adds the classesToAdd to the component's class list.
 * If classesToAdd is not provided, the function will not add any classes.
 * @param {Object} params - an object containing the component reference and optional parameters.
 * @param {React.MutableRefObject<HTMLElement | null>} params.componentRef - a reference to the component.
 * @param {string | string[]} [params.classesToRemove] - classes to remove from the component's class list.
 * @param {string | string[]} [params.classesToAdd] - classes to add to the component's class list.
 * @returns {void}
 */
export function classListHandler({ componentRef, classesToRemove, classesToAdd }) {
  if (componentRef.current) {
    if (classesToRemove) {
      componentRef.current.classList.remove(classesToRemove)
    }
    if (!classesToAdd) return

    componentRef.current.classList.add(classesToAdd)
  }
}

/**
 * Modifies the class list of a table's parent element based on a condition.
 *
 * This function accesses the parent element of a table component and conditionally
 * removes or adds specified CSS classes. It is designed to manipulate the appearance
 * of a scrollable table area based on the content size or other dynamic conditions.
 *
 * @param {Object} params - An object containing parameters for the function.
 * @param {React.MutableRefObject<HTMLElement | null>} params.tableRef - A reference to the table element.
 * @param {string | string[]} [params.classesToRemove] - Classes to remove from the table's parent element.
 * @param {string | string[]} [params.classesToAdd1] - Classes to add when the condition is true.
 * @param {string | string[]} [params.classesToAdd2] - Classes to add when the condition is false.
 * @param {boolean} params.condition - A boolean value that determines which classes to add.
 * @returns {void}
 */

export function customTableHandler({ tableRef, classesToRemove, classesToAdd1, classesToAdd2, condition }) {
  if (tableRef.current) {
    const scrollArea = tableRef.current.parentElement.parentElement.parentElement.children[1]

    if (classesToRemove) {
      scrollArea.parentElement.classList.remove(classesToRemove)
    }

    if (!classesToAdd1) return

    if (condition === true) scrollArea.parentElement.classList.add(classesToAdd1)

    if (classesToAdd2 && condition === false) scrollArea.parentElement.classList.add(classesToAdd2)
  }
}
