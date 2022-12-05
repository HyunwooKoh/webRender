@Library('epapyrus-shared-library') import com.epapyrus.*
def propertyList = new PropertyList()
def _slackSend = new SlackSend()
def _rocketSend = new RocketSend()
def mailSend = new MailSend()


pipeline {
  agent any
  environment {
    BUILD_TYPE = "release"
  }
  stages {
    stage('Set Properties') {
      steps {
        script {
          properties(
            propertyList.getPropertyList(this, env)
          )
        }
      }
    }
    stage('Build') {
      agent {
        node {
          label 'win'
        }
      }
      steps {
        script {
          env.TEXT_NAME = env.BRANCH_NAME.replace("/", ".")
          env.WIN_BUILD_TYPE = env.BUILD_TYPE.getAt(0).toUpperCase() + env.BUILD_TYPE.substring(1)
          try {
            bat """\
chcp 65001
python build.py
"""
            currentBuild.result = 'SUCCESS'
          } catch (err) {
            currentBuild.result = 'FAILURE'
          }
          
          if (env.GIT_BRANCH == "master") {
            bat 'git describe > version_temp_file'
            env.VERSION = readFile("version_temp_file")
            env.PATH_PRODUCT = "${env.PATH_PRODUCT_BASE_SFTP}/webRender/${env.VERSION}"
          } else if (env.GIT_BRANCH == "develop") {
            env.PATH_PRODUCT = "${env.PATH_PRODUCT_BASE_SFTP}/webRender/snapshot"
          } else {
            echo '[FAILURE] branch is not master or develop'
            currentBuild.result = 'FAILURE'
            return
          }

          sshPublisher(publishers: [
            sshPublisherDesc(configName: 'eddy', 
              transfers: [sshTransfer(
                execCommand: '', 
                execTimeout: 120000, 
                flatten: true, 
                makeEmptyDirs: true, 
                noDefaultExcludes: false, 
                remoteDirectory: "${PATH_PRODUCT}", 
                remoteDirectorySDF: false, 
                removePrefix: '', 
                sourceFiles: "dist/webrender-linux-x64.tar.gz, dist/webrender-win32-ia32.zip")], 
              usePromotionTimestamp: false, 
              useWorkspaceInPromotion: false, 
              verbose: true)
            ]
          )
        }
      }
    }
  }
}
