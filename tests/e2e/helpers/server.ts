import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve, join } from "node:path";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
const SERVER_ENTRY = resolve(import.meta.dirname, "../../../dist/index.js");
export interface TestServer { client: Client; transport: StdioClientTransport; cleanup: () => Promise<void> }
export async function startServer(env: Record<string,string> = {}, cwd?: string): Promise<TestServer> {
  let profileDir: string | undefined;
  const childEnv: Record<string,string> = { ...process.env as Record<string,string>, ...env };
  if (!("LIMELINK_PROFILES_FILE" in env) && !("LIMELINK_API_KEY" in env)) {
    profileDir = await mkdtemp(join(tmpdir(),"limelink-e2e-profile-"));
    const path=join(profileDir,"profiles.json");
    await writeFile(path,JSON.stringify({version:1,defaultProfile:"test",profiles:{test:{apiKey:"test-e2e-key",organizationLabel:"Test"}}}),{mode:0o600});
    childEnv.LIMELINK_PROFILES_FILE=path;
  } else if ("LIMELINK_API_KEY" in env && !("LIMELINK_PROFILES_FILE" in env)) delete childEnv.LIMELINK_PROFILES_FILE;
  const transport=new StdioClientTransport({command:"node",args:[SERVER_ENTRY],cwd,env:childEnv});
  const client=new Client({name:"limelink-e2e-test",version:"1.0.0"});await client.connect(transport);
  return {client,transport,cleanup:async()=>{try{await client.close()}catch{}try{await transport.close()}catch{}if(profileDir)await rm(profileDir,{recursive:true,force:true});}};
}
