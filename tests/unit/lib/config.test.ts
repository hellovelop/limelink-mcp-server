import { afterEach,describe,expect,it,vi } from "vitest";
import { mkdtempSync,writeFileSync,chmodSync,symlinkSync,rmSync } from "node:fs";
import { tmpdir } from "node:os";import { join } from "node:path";
import { loadConfig } from "../../../src/lib/config.js";
const dirs:string[]=[];function file(value:unknown,mode=0o600){const d=mkdtempSync(join(tmpdir(),"ll-prof-"));dirs.push(d);const p=join(d,"profiles.json");writeFileSync(p,typeof value==="string"?value:JSON.stringify(value));chmodSync(p,mode);return p;}
afterEach(()=>{dirs.splice(0).forEach(d=>rmSync(d,{recursive:true,force:true}));vi.restoreAllMocks();});
describe("loadConfig",()=>{
 it("ignores legacy variables",()=>expect(loadConfig({LIMELINK_API_KEY:"secret",LIMELINK_PROJECT_ID:"p"})).toEqual({version:1,profiles:new Map()}));
 it("loads version 1 profiles with optional Project aliases",()=>{const id="11111111-1111-4111-8111-111111111111";const p=file({version:1,defaultProfile:"a",profiles:{a:{apiKey:"key",organizationLabel:"Org",projects:{web:id}}}});const c=loadConfig({LIMELINK_PROFILES_FILE:p});expect(c.defaultProfile).toBe("a");expect(c.profiles.get("a")?.apiKey).toBe("key");expect(c.profiles.get("a")?.projects?.get("web")).toBe(id);});
 it("allows profiles without Project aliases",()=>{const p=file({version:1,profiles:{a:{apiKey:"key",organizationLabel:"Org"}}});expect(loadConfig({LIMELINK_PROFILES_FILE:p}).profiles.get("a")?.projects?.size).toBe(0);});
 it.each([{projects:{bad:"not-a-uuid"}},{projects:{" bad":"11111111-1111-4111-8111-111111111111"}},{projects:[]}])("rejects invalid Project aliases",(extra)=>{const p=file({version:1,profiles:{a:{apiKey:"key",organizationLabel:"Org",...extra}}});expect(()=>loadConfig({LIMELINK_PROFILES_FILE:p})).toThrow("schema");});
 it("accepts symlink and warns for readable target",()=>{const target=file({version:1,profiles:{}},0o640);const link=target+".link";symlinkSync(target,link);const spy=vi.spyOn(console,"error").mockImplementation(()=>{});expect(loadConfig({LIMELINK_PROFILES_FILE:link}).profiles.size).toBe(0);expect(spy).toHaveBeenCalledOnce();});
 it("does not warn when group bits are not readable",()=>{const p=file({version:1,profiles:{}},0o610);const spy=vi.spyOn(console,"error").mockImplementation(()=>{});expect(loadConfig({LIMELINK_PROFILES_FILE:p}).profiles.size).toBe(0);expect(spy).not.toHaveBeenCalled();});
 it("rejects duplicate JSON profile aliases",()=>{const raw='{"version":1,"profiles":{"prod":{"apiKey":"first","organizationLabel":"First"},"prod":{"apiKey":"second","organizationLabel":"Second"}}}';expect(()=>loadConfig({LIMELINK_PROFILES_FILE:file(raw)})).toThrow("invalid JSON");});
 it.each(["{",JSON.stringify({version:2,profiles:{}}),JSON.stringify({version:1,defaultProfile:"x",profiles:{}}),JSON.stringify({version:1,profiles:{bad:{apiKey:" key",organizationLabel:"x"}}})])("rejects invalid files",(raw)=>expect(()=>loadConfig({LIMELINK_PROFILES_FILE:file(raw)})).toThrow());
 it("errors never disclose content",()=>{const secret="sentinel-secret";const p=file(`{${secret}`);try{loadConfig({LIMELINK_PROFILES_FILE:p})}catch(e){expect(String(e)).not.toContain(secret);expect(String(e)).not.toContain(p);}});
});
