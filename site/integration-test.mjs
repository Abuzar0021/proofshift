import {Engine} from "./runtime/engine.js";
const $=id=>document.getElementById(id), log=[];
const write=t=>{$("log").textContent=log.join("\n")+"\n"+t};
const assert=(v,t)=>{if(!v)throw Error(t);log.push("PASS: "+t);write("")};
const subjects=["catalog","stock","shipping"];
let index=0,allTools=[],peerReceipts=[],decisions=[],approved=false;
const shape=(name,args)=>({content:"",toolCalls:[{id:"script-"+(++index),type:"function",function:{name,arguments:JSON.stringify(args)}}]});
function makeModel(isTop,network){
 let step=0;
 return {baseUrl:"browser://mock",mock:true,publisherFunded:false,async chat(req){
  const names=(req.tools||[]).map(t=>t.function.name);allTools.push({network,names});
  const last=[...req.messages].reverse().find(m=>m.role==="tool");
  if(isTop){
    if(step===0){step++;const name=names.find(n=>n.endsWith("catalog_evidence"));if(!name)throw Error("Catalog peer missing");return shape(name,{request:"mixed"})}
    if(step===1){step++;if(last)peerReceipts.push({subject:"catalog",content:last.content});const name=names.find(n=>n.endsWith("stock_evidence"));if(!name)throw Error("Stock peer missing");return shape(name,{request:"mixed"})}
    if(step===2){step++;if(last)peerReceipts.push({subject:"stock",content:last.content});const name=names.find(n=>n.endsWith("shipping_evidence"));if(!name)throw Error("Shipping peer missing");return shape(name,{request:"mixed"})}
    if(step===3){step++;if(last)peerReceipts.push({subject:"shipping",content:last.content});return shape("website_verify_sample",{scenario:"mixed"})}
    if(!last)throw Error("Verifier result absent");const parsed=JSON.parse(last.content);log.push("Verifier receipt: "+JSON.stringify(parsed).slice(0,2200));const raw=JSON.stringify(parsed);if(!raw.includes('"FAIL"')||!raw.includes('"allSignaturesValid":true'))throw Error("Unexpected independent verifier receipt");return {content:"Scripted integration completed. See independently checked receipts.",toolCalls:[]}
  }
  if(step++===0){if(!names.includes("website_read_sample"))throw Error("Peer bridge read tool missing");return shape("website_read_sample",{scenario:"mixed"})}
  if(!last)throw Error("Peer action response absent");const parsed=JSON.parse(last.content);const raw=JSON.stringify(parsed);if(!raw.includes("signedEnvelope")||!raw.includes("signature")||!raw.includes("payload"))throw Error("Missing evidence envelope for "+network);return {content:JSON.stringify(parsed),toolCalls:[]}
 }};
}
async function run(allow){
 const e=new Engine({originUrl:location.origin});const original=e._compile.bind(e);
 e._compile=async(...args)=>{const res=await original(...args);res.llm=makeModel(args[3]?.isTop===true,res.network.name);return res};
 e.onConsent=async info=>{decisions.push({peer:info.peerOrigin,decision:allow?"allow":"decline",request:info.requestText});return allow?"allow":"decline"};
 await e.loadTop();const result=await e.runTurn("Compare the mixed historical sample from all three test providers and verify the sample.");
 return result;
}
$("run").onclick=async()=>{$("run").disabled=true;try{
 if(!["127.0.0.1","localhost"].includes(location.hostname))throw Error("Local-only integration harness");
 const before=await run(false);assert(decisions.length===3,"Three explicit consent gates ran in decline test");assert(peerReceipts.length===3&&peerReceipts.every(x=>x.content.includes("declined")),"Declined peers were not invoked");assert(!allTools.some(x=>x.network!=="proofshift"),"No remote agent ran after denial");
 decisions=[];peerReceipts=[];allTools=[];
 const after=await run(true);assert(decisions.length===3&&decisions.every(x=>x.decision==="allow"),"Three peer consent gates allowed");
 assert(subjects.every(s=>allTools.some(x=>x.network===s+"_evidence"&&x.names.includes("website_read_sample"))),"All three remote agents received real bridge tool catalogs");
 assert(peerReceipts.length===3&&peerReceipts.every(x=>x.content.includes("signedEnvelope")&&x.content.includes("signature")),"All three peer bridge calls returned signed envelopes");
 assert(after.text.includes("Scripted integration completed"),"Independent fixed policy verifier returned FAIL with three valid signatures");
 $("status").textContent="ALL INTEGRATION CHECKS PASSED";write("");
 const a=document.createElement("a"),url=URL.createObjectURL(new Blob([JSON.stringify({test:"scripted model; actual runtime, browser and cross-origin bridge transport",decisions,peerReceipts,log},null,2)],{type:"application/json"}));a.href=url;a.download="proofshift-browser-integration.json";a.textContent="Download integration receipts";$("result").append(a);
 }catch(e){$("status").textContent="INTEGRATION FAILED: "+e.message;write(e.stack||String(e))}finally{$("run").disabled=false}};

