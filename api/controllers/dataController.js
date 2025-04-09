/*
 * © 2025 PVP Inc.
 * Source available under non-commercial license.
 * Commercial use prohibited without a commercial license.
 * See LICENSE.md file or contact licensing@pvp.co.jp
 */

const Project = require('../models/Project')
const ServiceAccount = require('../models/ServiceAccount')
const ServiceAccountKeys = require('../models/ServiceAccountKeys')
const User = require('../models/User')

exports.getProjectData = async (email) => {
  const userData = await User.findOne({ where: { email } })
  let projectName
  projectName = userData.projectName

  const projectData = await Project.findOne({ where: { projectName } })
  return projectData
}

exports.getServiceAccountData = async (projectId) => {
  const serviceAccountData = await ServiceAccount.findOne({ where: { projectId } })
  return serviceAccountData
}

exports.getServiceAccountKey = async (serviceAccountEmail) => {
  const serviceAccountKey = await ServiceAccountKeys.findOne({
    where: { serviceAccountEmail: serviceAccountEmail },
  })
  return serviceAccountKey
}
