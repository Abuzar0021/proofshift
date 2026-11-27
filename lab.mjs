import {spawn} from "node:child_process";import {once} from "node:events";import http from "node:http";import path from "node:path";import {fileURLToPath} from "node:url";import {readFile,stat} from "node:fs/promises";import {subjects} from "./site/engine.mjs";
const here=fileURLToPath(new URL(".",import.meta.url));
export async function start(base=8800){
 const origin="http://127.0.0.1:"+base,children=[],providers=[];
 try{
 for(const [i,s] of subjects.entries()){
  const child=spawn(process.execPath,[path.join(here,"provider.mjs"),s,String(base+i+1),origin],{cwd:here,stdio:["ignore","pipe","pipe"]});children.push(child);
  const pin=await new Promise((resolve,reject)=>{let buf="";const timer=setTimeout(()=>reject(Error("Provider startup timeout "+s)),5000);child.stdout.on("data",b=>{buf+=b.toString();if(buf.includes("\n")){clearTimeout(timer);try{resolve(JSON.parse(buf.split("\n")[0]))}catch(e){reject(e)}}});child.once("exit",()=>{clearTimeout(timer);reject(Error("Provider exited "+s))});child.once("error",reject)});providers.push(pin);
 }
 const config={providers},root=path.resolve(here,"site");
 const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".json":"application/json",".css":"text/css",".md":"text/plain; charset=utf-8"};
 const server=http.createServer(async(req,res)=>{try{
  const u=new URL(req.url,origin);if(req.method!=="GET"){res.writeHead(405);return res.end()}
  if(u.pathname==="/config"){res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"});return res.end(JSON.stringify(config))}
  const f=path.resolve(root,"."+(u.pathname==="/"?"/index.html":decodeURIComponent(u.pathname)));
  if(!f.startsWith(root+path.sep)||!(await stat(f)).isFile())throw Error("Missing");
  const publicFile=/(?:agent-manifest|\.network|links|agent-mcp|nsdeploy(?:-agent)?)\.json$/.test(f);
  res.writeHead(200,{"Content-Type":types[path.extname(f)]??"application/octet-stream","Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...(publicFile?{"Access-Control-Allow-Origin":"*"}:{}),...(f.endsWith("sandbox-worker.js")?{"Content-Security-Policy":"default-src 'none'; script-src blob:; connect-src 'none'; worker-src 'none'"}:{})});res.end(await readFile(f))
 }catch{res.writeHead(404);res.end("Not found")}});
 server.listen(base,"127.0.0.1");await once(server,"listening");
 const close=async()=>{await new Promise(r=>server.close(r));await Promise.all(children.map(c=>{if(c.exitCode!==null)return Promise.resolve();const end=once(c,"exit");c.kill();return end}))};
 return {origin,config,close,children};
 }catch(e){children.forEach(c=>c.kill());throw e}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const s=await start(Number(process.env.PORT??8800));console.log("ProofShift: "+s.origin+"; provider PIDs "+s.config.providers.map(p=>p.pid).join(", "));process.on("SIGINT",async()=>{await s.close();process.exit(0)})}
