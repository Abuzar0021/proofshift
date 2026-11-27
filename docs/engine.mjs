// Deterministic verifier; the model is never an authority for acceptance.
const te=new TextEncoder(),td=new TextDecoder("utf-8",{fatal:true});
export const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export const digest=async v=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",te.encode(canonical(v))))).map(x=>x.toString(16).padStart(2,"0")).join("");
export const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const exact=(v,ks)=>v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).length===ks.length&&ks.every(k=>Object.hasOwn(v,k));
const int=(v,a,b)=>Number.isSafeInteger(v)&&v>=a&&v<=b;
const isDigest=v=>typeof v==="string"&&/^[a-f0-9]{64}$/.test(v);
const sku=v=>typeof v==="string"&&/^[A-Z0-9-]{1,24}$/.test(v);
const skus=v=>Array.isArray(v)&&v.length<=32&&v.every(sku)&&new Set(v).size===v.length;
export const subjects=["catalog","stock","shipping"];
export const schema={catalog:v=>exact(v,["skus","prices"])&&skus(v.skus)&&v.skus.length>0&&exact(v.prices,v.skus)&&Object.values(v.prices).every(n=>int(n,0,100000000)),stock:v=>exact(v,["available","catalogDigest"])&&skus(v.available)&&isDigest(v.catalogDigest),shipping:v=>exact(v,["days","cents","catalogDigest","stockDigest"])&&int(v.days,0,365)&&int(v.cents,0,100000000)&&isDigest(v.catalogDigest)&&isDigest(v.stockDigest)};
export const policy=Object.freeze({id:"launch-v1",maxCents:400000,maxDays:3,requiredSKUs:Object.freeze(["A","B"])});
export async function verify(env,pin,challenge,at=Date.now(),previous){
 if(!exact(env,["payload","signature"])||typeof env.payload!=="string"||env.payload.length>16384||typeof env.signature!=="string"||env.signature.length>256)throw Error("Invalid envelope");
 const bytes=unb64(env.payload),sig=unb64(env.signature);
 const key=await crypto.subtle.importKey("jwk",pin.key,{name:"Ed25519"},false,["verify"]);
 if(sig.length!==64||!await crypto.subtle.verify("Ed25519",key,sig,bytes))throw Error("Signature rejected");
 const p=JSON.parse(td.decode(bytes));
 if(!exact(p,["schema","issuer","subject","nonce","revision","issued","expires","data"])||p.schema!==1||p.issuer!==pin.issuer||p.subject!==pin.subject||p.nonce!==challenge)throw Error("Issuer, subject or challenge mismatch");
 if(!int(p.revision,1,Number.MAX_SAFE_INTEGER)||!int(p.issued,0,Number.MAX_SAFE_INTEGER)||!int(p.expires,0,Number.MAX_SAFE_INTEGER)||p.issued>at+1000||p.expires<=at||p.expires<=p.issued||p.expires-p.issued>30000)throw Error("Evidence stale or invalid time");
 if(!schema[p.subject]?.(p.data))throw Error("Typed data rejected");
 const hash=await digest(p.data);
 if(previous&&(p.revision<previous.revision||(p.revision===previous.revision&&hash!==previous.digest)))throw Error("Rollback or equivocation");
 return {...p,digest:hash};
}
const graph=[
 ["catalog",["catalog"],[],(a,p)=>p.requiredSKUs.every(s=>a.catalog.data.skus.includes(s))],
 ["inventory",["catalog","stock"],["catalog"],a=>a.catalog.data.skus.every(s=>a.stock.data.available.includes(s))],
 ["shipping",["shipping"],[],(a,p)=>a.shipping.data.days<=p.maxDays],
 ["budget",["catalog","shipping"],["catalog"],(a,p)=>Object.values(a.catalog.data.prices).reduce((x,y)=>x+y,0)+a.shipping.data.cents<=p.maxCents],
 ["coherence",subjects,[],a=>a.stock.data.catalogDigest===a.catalog.digest&&a.shipping.data.catalogDigest===a.catalog.digest&&a.shipping.data.stockDigest===a.stock.digest],
 ["release",[],["inventory","shipping","budget","coherence"],()=>true]
];
export async function evaluate(evidence,old={},p=policy,at=Date.now()){
 const a=Object.fromEntries(subjects.filter(s=>evidence[s]?.expires>at).map(s=>[s,evidence[s]])),nodes={},rerun=[],reused=[];
 const policyDigest=await digest(p);
 for(const [id,inputs,deps,rule] of graph){
 const key=await digest({policyDigest,id,inputs:inputs.map(s=>a[s]?[a[s].issuer,a[s].revision,a[s].digest]:null),deps:deps.map(d=>[nodes[d].key,nodes[d].state])});
 if(old[id]?.key===key){nodes[id]=old[id];reused.push(id);continue}
 let state,reason;
 if(deps.some(d=>nodes[d].state==="FAIL")){state="FAIL";reason="A prerequisite failed"}
 else if(inputs.some(s=>!a[s])||deps.some(d=>nodes[d].state==="UNVERIFIED")){state="UNVERIFIED";reason="Evidence missing, rejected or expired"}
 else{state=rule(a,p)?"PASS":"FAIL";reason=state==="PASS"?"Requirement satisfied":id==="coherence"?"Authentic claims reference incompatible input revisions":"Requirement violated"}
 nodes[id]={key,state,reason};rerun.push(id);
 }
 return {verdict:nodes.release.state,nodes,rerun,reused,policyDigest,expires:subjects.every(s=>a[s])?Math.min(...subjects.map(s=>a[s].expires)):null};
}
export async function readJsonBounded(response,max=24000){
 if(!response.ok)throw Error("HTTP "+response.status);
 if(!response.body)throw Error("Missing response");
 const reader=response.body.getReader();let size=0,chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error("Response exceeds limit")}chunks.push(value)}}finally{reader.releaseLock()}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}return JSON.parse(td.decode(bytes));
}
export function validatePins(config){
 if(!Array.isArray(config?.providers)||config.providers.length!==3||new Set(config.providers.map(p=>p.subject)).size!==3||!subjects.every(s=>config.providers.some(p=>p.subject===s)))throw Error("Complete independent trust pins required");
}
export async function collect(config,scenario,history={},fetcher=fetch){
 validatePins(config);const nonce=crypto.randomUUID(),evidence={},errors={},envelopes={};
 await Promise.all(config.providers.map(async pin=>{try{
 const url=new URL("/evidence",pin.origin);url.searchParams.set("nonce",nonce);url.searchParams.set("scenario",scenario);
 const env=await readJsonBounded(await fetcher(url,{credentials:"omit",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(4000)}));
 const v=await verify(env,pin,nonce,Date.now(),history[pin.subject]);envelopes[pin.subject]=env;evidence[pin.subject]=v;
 }catch(e){errors[pin.subject]=String(e.message??e)}}));
 return {nonce,evidence,envelopes,errors};
}
export async function inspectSnapshot(receipt,pins,now=Date.now()){
 validatePins(pins);const at=Date.parse(receipt.checkedAt);
 if(!Number.isFinite(at)||at>now+1000||typeof receipt.nonce!=="string")throw Error("Invalid historical snapshot");
 const evidence={},errors={};
 for(const pin of pins.providers){try{evidence[pin.subject]=await verify(receipt.signedEnvelopes?.[pin.subject],pin,receipt.nonce,at)}catch(e){errors[pin.subject]=String(e.message??e)}}
 const result=await evaluate(evidence,{},policy,at);
 return {evidence,errors,result,allSignaturesValid:Object.keys(errors).length===0,claimMatches:receipt.result?.verdict===result.verdict,withinSignedExpiry:!!result.expires&&result.expires>now,releaseAuthorization:false};
}
