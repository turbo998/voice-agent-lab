import { DefaultAzureCredential, ManagedIdentityCredential } from "@azure/identity";
import type { TokenCredential } from "@azure/core-auth";

let managed: TokenCredential | undefined;
let local: TokenCredential | undefined;
export function azureCredential(mode = process.env.LAB_MODE): TokenCredential {
  if (mode === "azure") {
    managed ??= process.env.AZURE_CLIENT_ID
      ? new ManagedIdentityCredential({ clientId: process.env.AZURE_CLIENT_ID })
      : new ManagedIdentityCredential();
    return managed;
  }
  local ??= new DefaultAzureCredential();
  return local;
}
