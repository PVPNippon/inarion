'use client'
import Graph from 'react-graph-vis'
import { useEffect, useState } from 'react'
import { green, blue, red, purple } from '@mui/material/colors'

/**
 * The GraphPage component renders a graph of the hierarchy of groups that the user is in.
 * It is a temporary component for development purposes.
 * It is used to test the groups hierarchy visualizer backend code.
 * The component utilizes the LoggedInUserContext to access the email of the logged-in user and maintains state for the input value,
 * group list, click count, and error messages.
 * Graph visualization options are defined within the component,
 * including layout, physics, and edge configurations.
 * @returns {JSX.Element} - The rendered graph page component.
 */
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

      width = `${currentWindowWidth - 300}px`

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
          const unclasteredClusters = []

          /**
           * Determines if the given nodes form a perfect tree, i.e. every node has either 0 or 1 parent and either 0 or 2 children.
           * @param {array} nodes - The array of node keys to check.
           * @returns {boolean} - True if the nodes form a perfect tree, false otherwise.
           */
          function isPerfectTree(nodes) {
            return nodes.every(
              (node) =>
                (network.getConnectedNodes(node.id, 'from').length === 0 &&
                  network.getConnectedNodes(node.id, 'to').length === 2) ||
                (network.getConnectedNodes(node.id, 'from').length === 1 &&
                  network.getConnectedNodes(node.id, 'to').length === 2) ||
                (network.getConnectedNodes(node.id, 'from').length === 1 &&
                  network.getConnectedNodes(node.id, 'to').length === 0)
            )
          }
          /**
           * Gets an array of nodes that are connected to 3 or more of the given nodes.
           * @param {array} nodes - The array of node keys to check.
           * @returns {array} - An array of node keys that are connected to 3 or more of the given nodes.
           */
          function getRepeatedConnectedNodes(nodes) {
            let connectedNodes = []
            nodes.forEach((node) => {
              connectedNodes.push(...network.getConnectedNodes(node))
            })

            const counts = connectedNodes.reduce((acc, val) => {
              acc[val] = (acc[val] || 0) + 1
              return acc
            }, {})

            return Object.keys(counts).filter((key) => counts[key] >= 3)
          }

          /**
           * Manages the zoom of the graph visualization by fitting the network to a specified set of nodes.
           * @param {array} zoomNodes - The array of node keys to zoom to.
           * @returns {void}
           */
          function manageZoom(zoomNodes) {
            //IMPORTANT:Need to disable stabilization in physics for this to work↓
            network.fit({
              nodes: zoomNodes,
              animation: { duration: 1000 },
              //  minZoomLevel: 0.5,
              // maxZoomLevel: 2,
              maxZoomLevel: 0.9,
              //  padding: 150,
            })
          }

          /**
           * Adjusts the vertical position of nodes in alternating layers for better visual separation.
           *
           * This function iterates over an array of node arrays, checking the index of each node.
           * If the node's index in its array is odd, the function adjusts its vertical position
           * by adding or subtracting a fixed value, dependent on its current position.
           * This creates an alternating layering effect in the graph visualization.
           *
           * @param {Array<Array<string>>} nodesToLayer - An array containing arrays of node identifiers to be layered.
           */
          function manageLayering(nodesToLayer) {
            nodesToLayer.forEach((nodeArray) => {
              nodeArray.forEach((node) => {
                if (nodeArray.indexOf(node) % 2 !== 0) {
                  if (network.body.nodes[node].y <= 0) {
                    network.body.nodes[node].y -= 100
                  } else {
                    network.body.nodes[node].y += 100
                  }
                }
              })
            })
          }

          let clusterClickListener
          /**
           * Recursively clusters nodes together based on the number of nodes to cluster.
           * If a cluster is clicked, it will expand and show the first 10 nodes in the cluster,
           * and recluster the remaining nodes.
           * It will also layer the nodes so that nodes with odd indices are below
           * the nodes with even indices, and zoom in on the cluster.
           * @param {array} nodesToCluster - The array of node keys to cluster.
           * @param {number} a - The cluster id.
           * @param {array} allNodes - The array of all node keys.
           * @returns {void}
           */
          function manageClustering(nodesToCluster, a, allNodes) {
            let clusteredNodeCount = 0

            //remove cluster click listener if there is one
            //needed to add this because my physical one click on a cluster node resulted in 2 click events
            if (clusterClickListener) {
              network.off('click', clusterClickListener)
            }

            //set cluster id for the cluster node
            const clusterId = 'cluster' + a

            //if a cluster has been opened at least once, do not reapply clustering conditions, just reuse the already clustered nodes
            //I needed to add this logic because on 2nd etc reclustering some previously clustered nodes did not pass the condition and were not re-clustered
            //which caused more than 10 nodes to be released, which will be confised to the user who expects exactly 10 nodes to be released at once.
            if (unclasteredClusters.includes(clusterId)) {
              for (const node of nodesToCluster) {
                network.body.nodes[node].options.cid = a
                clusteredNodeCount++
              }
            } else {
              //get repeated connected node array(nodes which are connected to more than 3 nodes)
              //this is done to prevent clustering of unrelated nodes which happen to be on the same height
              const repeatedNodes = getRepeatedConnectedNodes(nodesToCluster)

              //find nodes with common connections and set cid for each such node
              //don't cluster user nodes
              for (const node of nodesToCluster) {
                if (node === 'users' || node === 'all_users') continue
                if (repeatedNodes.some((n) => network.getConnectedNodes(node).includes(n))) {
                  network.body.nodes[node].options.cid = a
                  clusteredNodeCount++
                }
              }
            }

            const clusterOptions = {
              /**
               * This function is used to determine which nodes to cluster together.
               * It checks if the node's cid property matches the cluster id.
               * @param {Object} nodeOptions - The options of the node to check.
               * @returns {boolean} - True if the node should be clustered, false otherwise.
               */
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
                label: clusteredNodeCount + ' member(s)',
              },
            }

            network.clustering.cluster(clusterOptions)

            clusterClickListener = (params) => {
              console.log('CLICK EVENT PARAMS', params)

              //check if cluster is clicked
              //its ID should start with "cluster", and not contain "@"(in case someone decides to name a group or user as "cluster")
              if (params.nodes.length > 0 && params.nodes[0].startsWith('cluster') && !params.nodes[0].includes('@')) {
                const clickedClusterId = params.nodes[0]

                //get cluster nodes, get them from the actual network for safety
                const clusterNodes = network.body.nodes[clickedClusterId].containedNodes
                //get all cluster nodes array
                const allClusterNodes = Object.keys(clusterNodes)

                //release cluster
                network.openCluster(clickedClusterId)
                if (!unclasteredClusters.includes(clickedClusterId)) unclasteredClusters.push(clickedClusterId)

                //do not recluster less than 13 nodes
                if (allClusterNodes.length < 13) {
                  allClusterNodes.forEach((node) => {
                    network.body.nodes[node].options.cid = ''
                  })
                  manageLayering(allNodes)
                  // manageZoom(allClusterNodes) //disabled rezooming for now because it looks too huge
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
                const cid = clickedClusterId.split('cluster')[1]
                manageClustering(nodesToRecluster, cid, allNodes)

                manageLayering(allNodes)
                // manageZoom([clusterId, ...nodesToShow])//disabled rezooming for now because it looks too huge
              }
            }

            network.on('click', clusterClickListener)
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

          //apply clustering and layering only if the graph is not a perfect tree(for now)
          if (!isPerfectTree(graph.nodes)) {
            lengthArray.reduce((counters, num) => {
              counters[num] = (counters[num] || 0) + 1
              if (counters[num] >= 10) {
                if (!repeatedArray.includes(num)) {
                  repeatedArray.push(num)
                }
              }
              return counters
            }, {})

            const allNodes = []
            if (repeatedArray.length > 0) {
              for (let a = 1; a < repeatedArray.length + 1; a++) {
                let sameLevelNodes = []
                for (const key in nodes) {
                  if (nodes[key].y === repeatedArray[a - 1]) {
                    sameLevelNodes.push(key)
                  }
                }

                allNodes.push(sameLevelNodes)

                //if there are more than 20 nodes at the same height, cluster them
                if (sameLevelNodes.length > 20) {
                  const nodesToCluster = sameLevelNodes.slice(20)
                  manageClustering(nodesToCluster, a, allNodes)
                }
                manageLayering(allNodes)
              }
            }
          }

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
