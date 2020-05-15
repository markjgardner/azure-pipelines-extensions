import tasks = require('azure-pipelines-task-lib/task');
import {ToolRunner} from 'azure-pipelines-task-lib/toolrunner';
import {TerraformAuthorizationCommandInitializer} from './terraform-commands';
import {BaseTerraformCommandHandler} from './base-terraform-command-handler';

export class TerraformCommandHandlerAzureRM extends BaseTerraformCommandHandler {
    constructor() {
        super();
        this.providerName = "azurerm";
    }

    private setupBackend(backendServiceName: string) {
        this.backendConfig.set('storage_account_name', tasks.getInput("backendAzureRmStorageAccountName", true));
        this.backendConfig.set('container_name', tasks.getInput("backendAzureRmContainerName", true));
        this.backendConfig.set('key', tasks.getInput("backendAzureRmKey", true));
        this.backendConfig.set('resource_group_name', tasks.getInput("backendAzureRmResourceGroupName", true));

        //If not set as explicit command line params, the AzureRM provider will search for the backend config as environment vars
        this.setBackendConfigParameterIfExists(backendServiceName, "subscriptionid", 'arm_subscription_id');
        this.setBackendConfigAuthorizationParameterIfExists(backendServiceName, "tenantid", 'arm_tenant_id');
        this.setBackendConfigAuthorizationParameterIfExists(backendServiceName, "serviceprincipalid", 'arm_client_id');
        this.setBackendConfigAuthorizationParameterIfExists(backendServiceName, "serviceprincipalkey", 'arm_client_secret');
    }

    public handleBackend(terraformToolRunner: ToolRunner): void {
        let backendServiceName = tasks.getInput("backendServiceArm", false);
        this.setupBackend(backendServiceName);

        for (let [key, value] of this.backendConfig.entries()) {
            terraformToolRunner.arg(`-backend-config=${key}=${value}`);
        }
    }

    public handleProvider(command: TerraformAuthorizationCommandInitializer) {
        if (command.serviceProvidername) {
            process.env['ARM_SUBSCRIPTION_ID']  = tasks.getEndpointDataParameter(command.serviceProvidername, "subscriptionid", false);
            process.env['ARM_TENANT_ID']        = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "tenantid", false);
            process.env['ARM_CLIENT_ID']        = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "serviceprincipalid", false);
            process.env['ARM_CLIENT_SECRET']    = tasks.getEndpointAuthorizationParameter(command.serviceProvidername, "serviceprincipalkey", false);
        }
    }
}