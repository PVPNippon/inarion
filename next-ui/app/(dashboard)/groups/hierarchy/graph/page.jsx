'use client'
import Graph from 'react-graph-vis'
import { useEffect, useState } from 'react'
import { green, blue, red, purple } from '@mui/material/colors'

export default function GraphPage() {
  const [graph, setGraph] = useState(null)
  const [options, setOptions] = useState(null)
  const [star, setStar] = useState(null)

  useEffect(() => {
    //get graph from local storage
    let storedGraph = localStorage.getItem('graph')

    if (storedGraph) {
      let height
      let width

      //get target group id  from local storage and set it in state
      setStar(JSON.parse(storedGraph).star.split(','))

      storedGraph = JSON.parse(storedGraph).graph

      //split email addresses to new lines
      storedGraph.nodes.forEach((node) => {
        const label = node.label.split('@').join(`@\n`)
        node.label = label
      })

      //set graph in state
      setGraph(storedGraph)

      const currentWindowHeight = window.innerHeight
      const currentWindowWidth = window.innerWidth

      console.log('CURRENT HEIGHT', currentWindowHeight)

      //I set default minheight to 1000px for smaller screens for now, need more testing
      currentWindowHeight > 1000 ? (height = `${currentWindowHeight - 100}px`) : (height = '1000px')

      width = `${currentWindowWidth - 100}px`

      const options = {
        layout: {
          improvedLayout: true,
          hierarchical: {
            enabled: true,
            levelSeparation: 150,
            //levelSeparation: 100,
            // nodeSpacing: 200,
            // treeSpacing: 200,
            blockShifting: true,
            edgeMinimization: true,
            parentCentralization: true,
            direction: 'UD', // UD, DU, LR, RL
            sortMethod: 'directed', // hubsize, directed
            //  shakeTowards: 'roots',
            //shakeTowards: 'leaves', //default
          },
        },
        physics: {
          enabled: true,
          hierarchicalRepulsion: {
            // nodeDistance: 200, // Put more distance between the nodes.
            nodeDistance: 250,
          },
          stabilization: false,
          // stabilization: true, //N.B> this setting prevents the graph from zooming on the star if it is too low
        },
        nodes: {
          shape: 'box',
          shapeProperties: {
            borderRadius: 8, // only for box shape
          },
        },
        edges: {
          width: 2,
          color: 'black',
          smooth: {
            type: 'discrete',
            roundness: 1,
          },
        },
        height: height,
        width: width,
        // groups: {
        //   myGroup: { color: { background: 'red', border: 'red' }, font: { color: 'white' } },
        //   parentGroup: { color: { background: 'blue', border: 'blue' }, font: { color: 'white' } },
        //   childGroup: { color: { background: 'green', border: 'green' }, font: { color: 'white' } },
        //   ancestorGroup: { color: { background: 'white', border: 'blue' }, font: { color: 'blue' } },
        //   descendantGroup: { color: { background: 'white', border: 'greend' }, font: { color: 'green' } },
        // },
      }

      setOptions(options)
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
          /**
           * Recursively clusters nodes together based on the number of nodes to cluster.
           * @param {array} nodesToCluster - The array of node keys to cluster.
           * @param {number} a - The cluster id.
           * @returns {void}
           */

          function manageZoom(zoomNodes) {
            //IMPORTANT:Need to disable stabilization in physics for this to work↓
            network.fit({
              nodes: zoomNodes,
              animation: { duration: 1000 },
              //  minZoomLevel: 0.5,
              // maxZoomLevel: 2,
              // padding: 150,
            })
          }
          function manageClustering(nodesToCluster, a) {
            //if there are less than 3 nodes to cluster, return
            if (!nodesToCluster || nodesToCluster.length < 3) return

            //set cid for each node
            nodesToCluster.forEach((node) => {
              network.body.nodes[node].options.cid = a
            })

            //set cluster id for the cluster node
            const clusterId = 'cluster' + a

            const clusterOptions = {
              joinCondition: function (nodeOptions) {
                return nodeOptions.cid === a
              },

              clusterNodeProperties: {
                id: clusterId,
                color: {
                  background: purple[500],
                  border: purple[500],
                },
                font: {
                  color: 'white',
                },
                label: nodesToCluster.length + ' member(s)',
              },
            }

            network.clustering.cluster(clusterOptions)

            network.on('click', (params) => {
              console.log('CLICK EVENT PARAMS', params)

              if (params.nodes[0] === clusterId && network.body.nodes[clusterId]) {
                //get cluster nodes, get them from the actual network for safety
                const clusterNodes = network.body.nodes[clusterId].containedNodes

                //get all cluster nodes array
                const allClusterNodes = Object.keys(clusterNodes)

                //release cluster
                network.openCluster(clusterId)

                //do not recluster less than 13 nodes
                if (allClusterNodes.length < 13) {
                  allClusterNodes.forEach((node) => {
                    network.body.nodes[node].options.cid = ''
                  })
                  manageZoom(allClusterNodes)
                  return
                }

                //select first 10 nodes
                const nodesToShow = allClusterNodes.slice(0, 10)
                console.log('NODES TO SHOW', nodesToShow)

                //select remaining nodes
                const nodesToRecluster = allClusterNodes.slice(10)
                console.log('NODES TO RECLUSTER', nodesToRecluster)

                //remove cid from nodes which won't be reclustered
                nodesToShow.forEach((node) => {
                  network.body.nodes[node].options.cid = ''
                })

                //recluster
                manageClustering(nodesToRecluster, a)
                manageZoom(nodesToShow)
              }
            })
          }

          network.body.nodes[star].options.font.color = 'white'
          network.body.nodes[star].options.color.background = red[500]
          network.body.nodes[star].options.color.border = red[900]

          const directParents = network.getConnectedNodes(star, 'from')
          for (const parent of directParents) {
            network.body.nodes[parent].options.font.color = 'white'
            network.body.nodes[parent].options.color.background = blue[500]
            network.body.nodes[parent].options.color.border = blue[500]
          }

          const directChildren = network.getConnectedNodes(star, 'to')
          for (const child of directChildren) {
            network.body.nodes[child].options.font.color = 'white'
            network.body.nodes[child].options.color.background = green[500]
            network.body.nodes[child].options.color.border = green[500]
          }

          const nodes = network.getPositions()

          const repeatedArray = []
          const lengthArray = []
          for (const key in nodes) {
            lengthArray.push(nodes[key].y)

            if (key === star) continue

            if (directChildren.includes(key) || directParents.includes(key)) continue

            if (nodes[key].y < nodes[star].y) {
              network.body.nodes[key].options.font.color = blue[700]
              network.body.nodes[key].options.color.background = 'white'
              network.body.nodes[key].options.color.border = blue[500]
            } else if (nodes[key].y > nodes[star].y) {
              network.body.nodes[key].options.font.color = green[700]
              network.body.nodes[key].options.color.background = 'white'
              network.body.nodes[key].options.color.border = green[500]
            }
          }

          network.setOptions(options)

          //find the highest and lowest node
          //event if there are only 2 nodes in the hierarchy, one of them will take a negative y value, so we can safely assume that highest-level nodes will be at a negative height.
          const lowestNodeHeight = Math.max(...lengthArray) //N.B. the lowest node has a positive y value
          const highestNodeHeight = Math.min(...lengthArray) //N.B. the highest node has a negative y value

          console.log('HIGHEST NODE HEIGHT', highestNodeHeight) //N.B. the highest node has a negative y value
          console.log('LOWEST NODE HEIGHT', lowestNodeHeight) //N.B. the lowest node has a positive y value
          lengthArray.reduce((counters, num) => {
            counters[num] = (counters[num] || 0) + 1
            if (counters[num] >= 10) {
              if (!repeatedArray.includes(num)) {
                repeatedArray.push(num)
              }
            }
            return counters
          }, {})

          if (repeatedArray.length > 0) {
            for (let a = 1; a < repeatedArray.length + 1; a++) {
              let sameLevelNodes = []
              for (const key in nodes) {
                if (nodes[key].y === repeatedArray[a - 1]) {
                  sameLevelNodes.push(key)
                }
              }

              //if there are more than 20 nodes at the same height, cluster them
              if (sameLevelNodes.length > 20) {
                console.log('SAME LEVEL NODES', sameLevelNodes)

                const nodesToCluster = sameLevelNodes.slice(20)
                manageClustering(nodesToCluster, a)
              }

              for (let i = 0; i < sameLevelNodes.length; i++) {
                if (i % 2 !== 0) {
                  const nodeId = sameLevelNodes[i]
                  if (repeatedArray[a - 1] <= 0) {
                    //TO DO: investigate why this part does not work(it does not workonly for negative y values)
                    //the y value changes, but the node does not move
                    network.body.nodes[nodeId].y -= 100
                  } else if (repeatedArray[a - 1] > 0) {
                    network.body.nodes[nodeId].y += 100
                  }
                }
              }
            }
          }
          const viewport = network.getViewPosition()
          //  console.log('VIEWPORT', viewport) //returns x and y coordinates of the center of the viewport, almost useless
          const starNode = network.getPosition(star)
          //  console.log('STAR NODE', starNode) //star node position for testing, will delete this part later

          // if star node is close to top or whole graph fits into the screen, don't zoom on it
          if (
            Math.abs(highestNodeHeight - nodes[star].y) >= 300 ||
            Math.abs(lowestNodeHeight - highestNodeHeight) > graph.height
          ) {
            manageZoom(star)
          }
        }}
      ></Graph>
    </main>
  )
}
