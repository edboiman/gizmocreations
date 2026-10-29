// Standalone Cloudflare Worker: copy this whole file into the Worker editor.
// Required: ALLOWED_ORIGIN, APP_TOKEN (secret, 16–512 chars), MODEL,
// PROVIDER=anthropic (default) or openai, and the corresponding API key secret.
// Protect paid requests with Cloudflare rate limiting and provider spending caps.
const SYSTEM = `Create an original colorwork knitting chart, not a complete garment pattern.
Return ONLY JSON: {"rows":["...","..."]}. Each row uses 0 (background), 1 (motif),
2 (accent). The first row is the TOP. Return exactly the requested rows and columns.
Prefer two colors per row, bold shapes and short carried-color gaps. Use background
space around a single motif unless the user asks for an all-over repeat. Do not
claim that the design is technically validated. Do not reproduce protected logos
or characters; offer an original design with the requested general mood.`;

function sameToken(a,b) { a=String(a);b=String(b);if(a.length>512)return false;let d=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return d===0; }
async function limitedJSON(req) {
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('Content-Type')||''))throw Object.assign(Error('Send application/json.'),{status:415});
  if(Number(req.headers.get('Content-Length')||0)>8192)throw Object.assign(Error('Request too large.'),{status:413});
  const reader=req.body?.getReader();if(!reader)throw Object.assign(Error('Invalid JSON object.'),{status:400});
  const chunks=[];let length=0;
  try{while(true){const{done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>8192){await reader.cancel();throw Object.assign(Error('Request too large.'),{status:413});}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Object.assign(Error('Invalid JSON object.'),{status:400});}
  if(!body||typeof body!=='object'||Array.isArray(body))throw Object.assign(Error('Invalid JSON object.'),{status:400});return body;
}
async function upstreamJSON(url,options) {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{const response=await fetch(url,{...options,signal:controller.signal});const data=await response.json();return {response,data};}
  finally{clearTimeout(timer);}
}
export default {
  async fetch(req,env) {
    const headers={'Access-Control-Allow-Origin':env.ALLOWED_ORIGIN||'','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-App-Token','Content-Type':'application/json','Vary':'Origin','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'};
    const reply=(o,status=200)=>new Response(JSON.stringify(o),{status,headers});
    if(!env.ALLOWED_ORIGIN||!env.APP_TOKEN||String(env.APP_TOKEN).length<16||String(env.APP_TOKEN).length>512)return reply({error:'Set ALLOWED_ORIGIN and a secret APP_TOKEN of 16–512 characters.'},500);
    if(req.headers.get('Origin')!==env.ALLOWED_ORIGIN)return reply({error:'Origin not allowed.'},403);
    if(req.method==='OPTIONS')return new Response(null,{headers});
    if(req.method!=='POST')return reply({error:'POST only.'},405);
    if(!sameToken(req.headers.get('X-App-Token')||'',env.APP_TOKEN))return reply({error:'Invalid app token.'},401);
    let body;try{body=await limitedJSON(req);}catch(e){return reply({error:e.status?e.message:'Invalid request.'},e.status||400);}
    const {cols,rows}=body,prompt=typeof body.prompt==='string'?body.prompt.trim():'';
    if(!prompt||prompt.length>400)return reply({error:'Use a design description from 1 to 400 characters.'},400);
    if(!Number.isInteger(cols)||cols<8||cols>120||!Number.isInteger(rows)||rows<8||rows>160)return reply({error:'Use 8–120 columns and 8–160 rows, as whole numbers.'},400);
    const provider=env.PROVIDER||'anthropic';
    if(!['anthropic','openai'].includes(provider)||!env.MODEL)return reply({error:'Set PROVIDER to anthropic or openai and set MODEL to a model available in your provider account.'},500);
    if(provider==='openai'?!env.OPENAI_API_KEY:!env.ANTHROPIC_API_KEY)return reply({error:'The selected provider API key is missing from Worker secrets.'},500);
    const user=`Create exactly ${rows} rows of exactly ${cols} stitches for: ${prompt}`;
    const limit=Math.min(24000,Math.max(2000,Math.ceil(cols*rows*1.3)+1000));
    try{
      let result;
      if(provider==='openai')result=await upstreamJSON('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify({model:env.MODEL,max_completion_tokens:limit,messages:[{role:'system',content:SYSTEM},{role:'user',content:user}]})});
      else result=await upstreamJSON('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:env.MODEL,max_tokens:limit,system:SYSTEM,messages:[{role:'user',content:user}]})});
      if(!result.response.ok)return reply({error:result.response.status===429?'AI provider rate limit reached. Try again later.':'AI provider rejected the request. Check MODEL, the API key and the provider’s output-token limit.'},result.response.status===429?429:502);
      const text=provider==='openai'?result.data.choices?.[0]?.message?.content:(result.data.content||[]).map(c=>c.text||'').join('');
      const match=typeof text==='string'?text.match(/\{[\s\S]*\}/):null,out=match?JSON.parse(match[0]):null;
      if(!out||!Array.isArray(out.rows)||out.rows.length!==rows||!out.rows.every(s=>typeof s==='string'&&s.length===cols&&/^[012]+$/.test(s)))return reply({error:'The AI did not return your selected chart dimensions. Try again; your existing chart was kept.'},502);
      return reply({rows:out.rows});
    }catch(e){return reply({error:e.name==='AbortError'?'AI provider timed out. Try again.':'The AI response could not be read. Try again.'},502);}
  }
};
