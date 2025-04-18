/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
//functions to access and upodate the virtual DOM(fiber tree) programmatically

/**
 * Converts the input argument into an array.
 *
 * If the input is already an array, it returns the input as is.
 * If the input is a string, it splits the string by spaces and returns an array of the resulting substrings.
 *
 * @param {Array|string} args - The input to be converted to an array.
 * @returns {Array} An array derived from the input argument.
 */

function createArray(args) {
  let result
  if (Array.isArray(args)) {
    result = args
  } else {
    result = args.split(' ')
  }
  return result
}

/**
 * A utility function to dynamically update the classList of a component's DOM node
 * given a React ref to the component and two optional parameters:
 * - classesToRemove: a string or array of class names to remove from the DOM node
 * - classesToAdd: a string or array of class names to add to the DOM node
 *
 * @param {Object} options - options object with the properties described above
 * @param {React.Ref} options.componentRef - a React ref to the component
 * @param {Array<string>|string} [options.classesToRemove] - a string or array of class names to remove from the DOM node
 * @param {Array<string>|string} [options.classesToAdd] - a string or array of class names to add to the DOM node
 */
export function classListHandler({ componentRef, classesToRemove, classesToAdd }) {
  if (componentRef.current) {
    if (classesToRemove) {
      componentRef.current.classList.remove(...createArray(classesToRemove))
    }
    if (!classesToAdd) return

    componentRef.current.classList.add(...createArray(classesToAdd))
  }
}

/**
 * Dynamically updates the classList of a component's scroll area parent based on the specified conditions.
 *
 * This function modifies the DOM node's class list associated with a table component's reference.
 * It removes specified classes and conditionally adds new classes to the scroll area's parent element.
 *
 * @param {Object} options - Options object with properties to control class list modifications.
 * @param {React.Ref} options.tableRef - A React ref to the table component.
 * @param {Array<string>|string} [options.classesToRemove] - A string or array of class names to remove.
 * @param {Array<string>|string} [options.classesToAdd1] - A string or array of class names to add if the condition is true.
 * @param {Array<string>|string} [options.classesToAdd2] - A string or array of class names to add if the condition is false.
 * @param {boolean} options.condition - A boolean condition to determine which classes to add.
 */
export function customTableHandler({ tableRef, classesToRemove, classesToAdd1, classesToAdd2, condition }) {
  if (tableRef.current) {
    const scrollArea = tableRef.current.parentElement.parentElement.parentElement.children[1]

    if (classesToRemove) {
      scrollArea.parentElement.classList.remove(...createArray(classesToRemove))
    }

    if (!classesToAdd1) return

    if (condition === true) scrollArea.parentElement.classList.add(...createArray(classesToAdd1))

    if (classesToAdd2 && condition === false) scrollArea.parentElement.classList.add(...createArray(classesToAdd2))
  }
}
