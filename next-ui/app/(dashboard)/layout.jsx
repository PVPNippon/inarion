'use client'

import { AppSidebar } from '../ui/dashboard/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import Header from '../ui/dashboard/header'
import { ValueProvider } from '../ui/contexts/ValueContext'
import { LoggedInUserProvider } from '../ui/contexts/LoggedInUserContext'
import { ProjectDataProvider } from '../ui/contexts/ProjectDataContext'

export const experimental_ppr = true

/**
 * A top-level component for rendering a dashboard page.
 *
 * This component is responsible for rendering the overall layout of the page,
 * including the header, side navigation, and main content area. It accepts
 * a single child element, which will be rendered in the main content area.
 *
 * The side navigation is initially collapsed to a narrow width, and can be
 * expanded or collapsed by clicking the toggle button in the header.
 *
 * @param {React.ReactElement} children - The child element to render in the
 * content area.
 * @returns {React.ReactElement} The rendered dashboard layout.
 */
export default function Layout({ children }) {
  return (
    <ValueProvider>
      <LoggedInUserProvider>
        <ProjectDataProvider>
          <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
              <div>
                <Header />
                <div className=" px-3 pt-8 pl-6">{children}</div>
              </div>
            </main>
          </SidebarProvider>
        </ProjectDataProvider>
      </LoggedInUserProvider>
    </ValueProvider>
  )
}
