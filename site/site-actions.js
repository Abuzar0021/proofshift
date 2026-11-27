import {inspectSnapshot} from "./engine.mjs";
export async function inspect(scenario){if(!["baseline","mixed","reconciled","delay"].includes(scenario))return {ok:false,reason:"Unknown published sample"};
 const pins=await (await fetch(new URL("./samples/test-pins.json",import.meta.url))).json();
 const receipt=await (await fetch(new URL("./samples/"+scenario+".json",import.meta.url))).json();
 const r=await inspectSnapshot(receipt,pins);
 return {ok:true,mode:"historical synthetic sample",scenario,verdict:r.result.verdict,nodes:Object.fromEntries(Object.entries(r.result.nodes).map(([id,v])=>[id,{state:v.state,reason:v.reason}])),allSignaturesValid:r.allSignaturesValid,claimMatches:r.claimMatches,withinSignedExpiry:r.withinSignedExpiry,releaseAuthorization:false};
}
export function registerActions(actions){actions.register({name:"verify_sample",description:"Independently recompute a published historical synthetic release scenario using the locally pinned demonstration keys. Read-only. Never authorizes an actual release.",effect:"read",inputSchema:{type:"object",properties:{scenario:{type:"string",enum:["baseline","mixed","reconciled","delay"]}},required:["scenario"],additionalProperties:false},execute:({scenario})=>inspect(scenario)});}
