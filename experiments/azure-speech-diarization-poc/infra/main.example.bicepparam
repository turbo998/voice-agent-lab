using './main.bicep'

// Replace every placeholder before validation or deployment.
param location = '<azure-region>'
param resourceGroupName = '<resource-group-name>'
param speechAccountName = '<globally-unique-speech-account>'
param principalId = '<operator-object-id>'
param tags = {
  purpose: 'speech-diarization-poc'
  environment: 'nonproduction'
}
