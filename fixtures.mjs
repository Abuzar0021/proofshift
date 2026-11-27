import {createHash} from "node:crypto";import {canonical} from "./site/engine.mjs";
const sha=x=>createHash("sha256").update(canonical(x)).digest("hex");
export const scenarios=["baseline","mixed","reconciled","delay","overbudget","stockout","replay","tamper","offline","rollback"];
export function data(s){
 const base={skus:["A","B"],prices:{A:110000,B:190000}},catalog=structuredClone(base);
 if(["mixed","reconciled"].includes(s))catalog.prices.B+=1000;
 const stock={available:s==="stockout"?["A"]:["A","B"],catalogDigest:sha(s==="mixed"?base:catalog)};
 const shipping={days:["delay","rollback","tamper"].includes(s)?5:2,cents:s==="overbudget"?150000:45000,catalogDigest:stock.catalogDigest,stockDigest:sha(stock)};
 return {catalog,stock,shipping};
}
