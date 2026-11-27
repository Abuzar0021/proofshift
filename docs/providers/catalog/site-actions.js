export async function readSample(scenario){
 if(!["baseline","mixed","reconciled","delay"].includes(scenario))return {ok:false,reason:"Unknown sample"};
 const r=await fetch(new URL("./samples/"+scenario+".json",import.meta.url));if(!r.ok)return {ok:false,reason:"Sample unavailable"};
 return {ok:true,mode:"historical synthetic",subject:"catalog",evidence:await r.json(),releaseAuthorization:false};
}
export function registerActions(actions){actions.register({name:"read_sample",description:"Read historical signed fixture evidence; never a live commitment.",effect:"read",inputSchema:{type:"object",properties:{scenario:{type:"string",enum:["baseline","mixed","reconciled","delay"]}},required:["scenario"],additionalProperties:false},execute:({scenario})=>readSample(scenario)})}
