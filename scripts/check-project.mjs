import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';import {resolve,dirname,join} from 'node:path';
const required=['package.json','app/layout.tsx','app/page.tsx','app/loja/page.tsx','app/api/checkout/route.ts','app/api/stripe/webhook/route.ts','app/admin/page.tsx','supabase/migrations/001_schema.sql','supabase/migrations/002_catalog_drafts.sql','.env.example','README.md','public/images/logo-oficial.png'];
const missing=required.filter(p=>!existsSync(p));if(missing.length){console.error('Ficheiros em falta:',missing);process.exit(1)}
function files(d){return readdirSync(d).flatMap(n=>{const p=join(d,n);return statSync(p).isDirectory()?files(p):/\.tsx?$/.test(p)?[p]:[]})}
const sources=[...files('app'),...files('components'),...files('lib')];const bad=[];
for(const file of sources){const txt=readFileSync(file,'utf8');for(const m of txt.matchAll(/from\s*['"]((?:\.\.?\/|@\/)[^'"]+)['"]/g)){let loc=m[1].startsWith('@/')?m[1].replace('@/', './'):join(dirname(file),m[1]);loc=resolve(loc);if(!['.ts','.tsx','/index.ts','/index.tsx'].some(ext=>existsSync(loc+ext)))bad.push(`${file}: ${m[1]}`)}}
if(bad.length){console.error('Imports locais sem ficheiro:',bad);process.exit(1)}
const sql=readFileSync('supabase/migrations/001_schema.sql','utf8');for(const term of ['create_order_and_reserve','finalize_order','security definer','enable row level security','service_role'])if(!sql.includes(term))throw Error('Falta SQL '+term);
console.log(`Verificação estática OK: ${sources.length} ficheiros TS/TSX, ${required.length} ficheiros essenciais, imports locais e regras SQL.`)

// Garante que os helpers do browser não importam código do servidor.
const browserHelper=readFileSync('lib/supabase.ts','utf8');
if(browserHelper.includes('next/headers')||browserHelper.includes('SUPABASE_SERVICE_ROLE_KEY'))throw Error('Importação do servidor no helper browser Supabase.');
for(const file of sources){
 const body=readFileSync(file,'utf8').trimStart();
 if((body.startsWith("'use client'")||body.startsWith('"use client"'))&&body.includes('supabase-server'))throw Error('Importação Supabase servidor num Client Component: '+file);
}
