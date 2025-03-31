'use client'
// import '../globals.css'
import { homePageStyles } from '@/app/[locale]/home-page/home-page-styles'
import React, { useContext, useEffect, useState } from 'react'
import { LoggedInUserContext } from '../contexts/LoggedInUserContext'
import { ProjectDataContext } from '../contexts/ProjectDataContext'
import axios from 'axios'

/**
 * The HomePage component fetches project data from the server using the user's
 * email from the context, and displays it. If the data is still loading, it
 * displays a loading message. If there's an error, it displays an error message.
 * @see ProjectDataContext
 * @see LoggedInUserContext
 */
const HomePage = () => {
  const { projectData, setProjectData } = useContext(ProjectDataContext) // Use ProjectDataContext
  const [loading, setLoading] = useState(true) // Loading is initially true
  const [error, setError] = useState(null) // Error initially null
  const { email } = useContext(LoggedInUserContext) // Get email from context

  useEffect(() => {
    // If projectData is already available, no need to fetch
    if (projectData) {
      setLoading(false)
      console.log('Project data already present, no need to fetch')
      return // Exit early
    }

    // Ensure email is available before making the request
    if (!email) {
      setError('Email is missing from context')
      setLoading(false)
      return
    }

    const fetchProjectData = async () => {
      try {
        console.log('Fetching data from Backend')

        const response = await axios.post(
          'http://localhost:4000/project/get-project-data',
          {
            userEmail: email,
          },
          {
            withCredentials: true, // Ensure cookies/session are sent
          }
        )

        let data = response.data

        // Ensure data is an object
        if (typeof data === 'string') {
          data = JSON.parse(data)
        }

        setProjectData(data) // Set the fetched data
        console.log(data)
        setLoading(false) // Set loading to false once the data is fetched
      } catch (err) {
        setError(err.message) // Set the error message if there's an issue
        setLoading(false) // Stop loading even if there's an error
      }
    }

    fetchProjectData()
  }, [email, projectData, setProjectData]) // Fetch the data whenever email changes

  // Display loading spinner
  if (loading) return <p>Loading...</p>

  // Display error message if an error occurs
  if (error) return <p>Error: {error}</p>

  // If there's no error and the data has been fetched, display it
  return (
    <div className="font-normal">
      <section className="mb-10">
        <h1 className="text-2xl mb-6">Hello, Jonathan</h1>
        <p className="text-base mb-5">You have 6 new alerts. 2 are tagged as critical and/or time sensitive.</p>

        {/* alert chips from here */}
        {/* alert chip1 */}
        <div className="flex">
          <div className={homePageStyles.alertChips}>
            <svg
              className="self-center"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 13.3333L8 6.66667L6 3.33334M4 13.3333L2 10L6 3.33334M4 13.3333H12L14 10M6 3.33334L10 10H14M6 3.33334H10L14 10M6 10H14"
                stroke="white"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <p className="ms-1">13 files have recently been shared externally</p>
          </div>

          {/* alert chip2 */}
          <div className={`ms-2.5 ${homePageStyles.alertChips}`}>
            <svg
              className="self-center"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10.667 2V4.66667M5.33366 2V4.66667M2.66699 7.33333H13.3337M2.66699 4.66667C2.66699 4.31304 2.80747 3.97391 3.05752 3.72386C3.30756 3.47381 3.6467 3.33333 4.00033 3.33333H12.0003C12.3539 3.33333 12.6931 3.47381 12.9431 3.72386C13.1932 3.97391 13.3337 4.31304 13.3337 4.66667V12.6667C13.3337 13.0203 13.1932 13.3594 12.9431 13.6095C12.6931 13.8595 12.3539 14 12.0003 14H4.00033C3.6467 14 3.30756 13.8595 3.05752 13.6095C2.80747 13.3594 2.66699 13.0203 2.66699 12.6667V4.66667ZM5.33366 10H6.66699V11.3333H5.33366V10Z"
                stroke="white"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <p className="ms-1">1 deleted user is the organizer of multiple calendar events.</p>
          </div>
          <a className="ps-4 py-2.5 text-sm">See more</a>
        </div>
      </section>
      {/* domain insights from here */}
      <section>
        <div className="flex justify-between mb-6">
          <p>Domain Insights</p>
          <div className="flex">
            <svg width="24" height="24" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14 17.5H20M17 14.5V20.5M4 5.5C4 5.23478 4.10536 4.98043 4.29289 4.79289C4.48043 4.60536 4.73478 4.5 5 4.5H9C9.26522 4.5 9.51957 4.60536 9.70711 4.79289C9.89464 4.98043 10 5.23478 10 5.5V9.5C10 9.76522 9.89464 10.0196 9.70711 10.2071C9.51957 10.3946 9.26522 10.5 9 10.5H5C4.73478 10.5 4.48043 10.3946 4.29289 10.2071C4.10536 10.0196 4 9.76522 4 9.5V5.5ZM14 5.5C14 5.23478 14.1054 4.98043 14.2929 4.79289C14.4804 4.60536 14.7348 4.5 15 4.5H19C19.2652 4.5 19.5196 4.60536 19.7071 4.79289C19.8946 4.98043 20 5.23478 20 5.5V9.5C20 9.76522 19.8946 10.0196 19.7071 10.2071C19.5196 10.3946 19.2652 10.5 19 10.5H15C14.7348 10.5 14.4804 10.3946 14.2929 10.2071C14.1054 10.0196 14 9.76522 14 9.5V5.5ZM4 15.5C4 15.2348 4.10536 14.9804 4.29289 14.7929C4.48043 14.6054 4.73478 14.5 5 14.5H9C9.26522 14.5 9.51957 14.6054 9.70711 14.7929C9.89464 14.9804 10 15.2348 10 15.5V19.5C10 19.7652 9.89464 20.0196 9.70711 20.2071C9.51957 20.3946 9.26522 20.5 9 20.5H5C4.73478 20.5 4.48043 20.3946 4.29289 20.2071C4.10536 20.0196 4 19.7652 4 19.5V15.5Z"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              className="ms-4"
              width="24"
              height="24"
              viewBox="0 0 24 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5 7L17.5 11M4 20.5H8L18.5 10C18.7626 9.73735 18.971 9.42555 19.1131 9.08239C19.2553 8.73923 19.3284 8.37143 19.3284 8C19.3284 7.62856 19.2553 7.26077 19.1131 6.9176C18.971 6.57444 18.7626 6.26264 18.5 6C18.2374 5.73735 17.9256 5.52901 17.5824 5.38687C17.2392 5.24473 16.8714 5.17157 16.5 5.17157C16.1286 5.17157 15.7608 5.24473 15.4176 5.38687C15.0744 5.52901 14.7626 5.73735 14.5 6L4 16.5V20.5Z"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="flex flex-wrap">
          <div className={homePageStyles.domainInsightsCard}></div>
          <div className={homePageStyles.domainInsightsCard}></div>
          <div className={homePageStyles.domainInsightsCard}></div>
          <div className={homePageStyles.domainInsightsCard}></div>
          <div className={homePageStyles.domainInsightsCard}></div>
          <div className={homePageStyles.domainInsightsCard}></div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
