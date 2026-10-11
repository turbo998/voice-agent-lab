targetScope = 'subscription'

param budgetName string
param labResourceGroupName string
param managedResourceGroupName string
param startDate string
@secure()
param notificationContacts object

resource budget 'Microsoft.Consumption/budgets@2024-08-01' = {
  name: budgetName
  properties: {
    category: 'Cost'
    amount: 150
    timeGrain: 'Monthly'
    timePeriod: { startDate: startDate }
    filter: {
      dimensions: {
        name: 'ResourceGroupName'
        operator: 'In'
        values: [labResourceGroupName, managedResourceGroupName]
      }
    }
    notifications: {
      Actual75: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: 50
        thresholdType: 'Actual'
        contactEmails: notificationContacts.contactEmails
      }
      Actual100: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: json('66.66666666666667')
        thresholdType: 'Actual'
        contactEmails: notificationContacts.contactEmails
      }
      Actual120: {
        enabled: true
        operator: 'GreaterThanOrEqualTo'
        threshold: 80
        thresholdType: 'Actual'
        contactEmails: notificationContacts.contactEmails
      }
    }
  }
}
