/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

'use client'
/**
 * A placeholder component for the people page.
 *
 * @returns {JSX.Element} A JSX element with a heading and a paragraph that says
 * this is a placeholder for the people page.
 */
import { useState } from 'react'
import Title from '@/app/ui/components/user-title'
import Search from '@/app/ui/components/user-search'
import Result from '@/app/ui/components/user-result'
import { LoggedInUserProvider } from '@/app/ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '@/app/ui/contexts/ProjectDataContext'

export default function People() {
  const [showResult, setShowResult] = useState(false)

  return (
    <LoggedInUserProvider>
      <ProjectDataProvider>
        <Title />
        {showResult ? (
          <Result setShowResult={setShowResult} />
        ) : (
          <Search showResult={showResult} setShowResult={setShowResult} />
        )}
      </ProjectDataProvider>
    </LoggedInUserProvider>
  )
}
