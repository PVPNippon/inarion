/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
// src/Form.js
import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ValueContext } from '../contexts/ValueContext'

/**
 * A simple form component that accepts user input and navigates to the result page,
 * passing the input value to the ValueContext.
 *
 * @returns A JSX element representing the form.
 */
const Form = () => {
  const [inputValue, setInputValue] = useState('')
  const { setValue } = useContext(ValueContext)
  const navigate = useNavigate()

  /**
   * Handles the form submission by preventing the default behavior, updating the
   * ValueContext with the current input value, and navigating to the result page.
   *
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    setValue(inputValue)
    navigate('/result')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter something"
      />
      <button type="submit">Save</button>
    </form>
  )
}

export default Form
