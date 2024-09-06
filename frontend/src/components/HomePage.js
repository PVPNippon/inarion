import React, { useEffect, useState } from 'react';
import { useProjectContext } from './ProjectContext';

const SuccessPage = () => {
  const { updateProjectData } = useProjectContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        // Fetch the project data from the backend
        const response = await fetch('http://localhost:4000/store-project-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }

        const data = await response.json();
        updateProjectData(data); // Store the data in context
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [updateProjectData]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return <div>Project data has been stored successfully!</div>;
};

export default SuccessPage;
