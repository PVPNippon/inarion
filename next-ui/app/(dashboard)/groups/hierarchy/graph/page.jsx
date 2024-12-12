'use client'
import Graph from 'react-graph-vis'
import { useEffect, useState } from 'react'

export default function GraphPage() {
  const [graph, setGraph] = useState(null)
  const [options, setOptions] = useState(null)

  useEffect(() => {
    const storedGraph = localStorage.getItem('graph')
    console.log(storedGraph)
    if (storedGraph) {
      setGraph(JSON.parse(storedGraph).graph)
      setOptions(JSON.parse(storedGraph).options)
    }
  }, [])

  if (!graph) {
    return <div>Loading...</div>
  }

  return (
    <main>
      <h2>Graph Page</h2>
      <p>This is a placeholder for the graph page.</p>
      <Graph
        graph={graph}
        options={options}
        getNetwork={(network) => {
          const nodes = network.getPositions()

          const repeatedArray = []
          const lengthArray = []
          for (const key in nodes) {
            lengthArray.push(nodes[key].y)
          }

          console.log(lengthArray)
          lengthArray.reduce((counters, num) => {
            counters[num] = (counters[num] || 0) + 1
            if (counters[num] >= 10) {
              if (!repeatedArray.includes(num)) {
                repeatedArray.push(num)
              }
            }
            return counters
          }, {})
          console.log(repeatedArray)

          if (repeatedArray.length > 0) {
            repeatedArray.forEach((element) => {
              const sameLevelNodes = []
              for (const key in nodes) {
                if (nodes[key].y === element) {
                  sameLevelNodes.push(key)
                }
              }
              // console.log(sameLevelNodes)
            })
          }
        }}
      ></Graph>
    </main>
  )
}
