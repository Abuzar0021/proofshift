import http from "node:http";import {generateKeyPairSync,sign} from "node:crypto";import {readFile,stat} from "node:fs/promises";import path from "node:path";import {fileURLToPath} from "node:url";import {canonical,b64,subjects} from "./site/engine.mjs";import {data,scenarios} from "./fixtures.mjs";
const [subject,portText,caller]=process.argv.slice(2),port=Number(portText);
if(!subjects.includes(subject)||!Number.isInteger(port)||port<1024||port>65535)throw Error("Invalid provider arguments");
const origin="http://127.0.0.1:"+port,issuer="fixture-"+subject,{privateKey,publicKey}=generateKeyPairSync("ed25519"),key=publicKey.export({format:"jwk"});
let revision=1,prior=canonical(data("baseline")[subject]),old;
const root=fileURLToPath(new URL("./site/providers/"+subject+"/",import.meta.url));
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json",".css":"text/css",".md":"text/plain; charset=utf-8"};
const server=http.createServer(async(req,res)=>{const reply=(status,body,type="application/json",cors=false)=>{res.writeHead(status,{"Content-Type":type,"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...(cors?{"Access-Control-Allow-Origin":caller,"Vary":"Origin"}:{})});res.end(body)};
 try{if(req.method!=="GET")return reply(405,"{}");const u=new URL(req.url,origin);
 if(u.pathname==="/pin")return reply(200,JSON.stringify({subject,issuer,origin,key,pid:process.pid}),undefined,true);
 if(u.pathname==="/evidence"){
  const nonce=u.searchParams.get("nonce"),scenario=u.searchParams.get("scenario");
  if(!/^[a-f0-9-]{36}$/.test(nonce??"")||!scenarios.includes(scenario))return reply(400,"{}",undefined,true);
  if(subject==="shipping"&&scenario==="offline")return reply(503,"{}",undefined,true);
  if(subject==="shipping"&&scenario==="replay"&&old)return reply(200,JSON.stringify(old),undefined,true);
  const value=data(scenario)[subject],d=canonical(value);if(d!==prior){revision++;prior=d;}
  const now=Date.now(),p={schema:1,issuer,subject,nonce,revision:subject==="shipping"&&scenario==="rollback"?1:revision,issued:now,expires:now+20000,data:value};
  const bytes=Buffer.from(canonical(p)),env={payload:b64(bytes),signature:b64(sign(null,bytes,privateKey))};
  if(subject==="shipping"&&scenario==="tamper"){p.data.days=1;env.payload=b64(Buffer.from(canonical(p)))}
  if(scenario==="baseline")old=env;
  return reply(200,JSON.stringify(env),undefined,true);
 }
 const rel=u.pathname==="/"?"/index.html":decodeURIComponent(u.pathname);
 const f=path.resolve(root,"."+rel);if(!f.startsWith(path.resolve(root)+path.sep))return reply(404,"{}");if(!(await stat(f)).isFile())return reply(404,"{}");
 const publicFile=/(?:agent-manifest|\.network|links|agent-mcp|nsdeploy(?:-agent)?)\.json$/.test(f);
 const headers={"Content-Type":types[path.extname(f)]??"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...(publicFile?{"Access-Control-Allow-Origin":"*"}:{}),...(f.endsWith("sandbox-worker.js")?{"Content-Security-Policy":"default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'"}:{})};
 res.writeHead(200,headers);res.end(await readFile(f));
 }catch{reply(404,"{}");}});
server.listen(port,"127.0.0.1",()=>console.log(JSON.stringify({subject,issuer,origin,key,pid:process.pid})));
