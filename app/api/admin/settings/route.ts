import {NextResponse} from 'next/server';import {adminDb,isAdmin} from '@/lib/supabase-server';
export async function POST(req:Request){if(!(await isAdmin()))return NextResponse.json({error:'Sem permissão'},{status:403});const db=adminDb();if(!db)return NextResponse.json({error:'Sem BD'},{status:503});let body:Record<string,unknown>;try{body=await req.json()}catch{return NextResponse.json({error:'JSON inválido'},{status:400})}
 const rows=[];
 if(typeof body.promo_text==='string'&&body.promo_text.length<150)rows.push({key:'promo_text',value:body.promo_text});
 if(typeof body.contact_email==='string'&&body.contact_email.length<150)rows.push({key:'contact_email',value:body.contact_email});
 if(body.shipping_rates&&typeof body.shipping_rates==='object'){const rates=body.shipping_rates as Record<string,unknown>;const values:Record<string,number>={};for(const k of ['acores','madeira','continente']){const v=rates[k];if(!Number.isInteger(v)||Number(v)<0||Number(v)>50000)return NextResponse.json({error:'Portes inválidos'},{status:400});values[k]=Number(v)}rows.push({key:'shipping_rates',value:values})}
 if(typeof body.buy5pay4_enabled==='boolean')rows.push({key:'buy5pay4_enabled',value:body.buy5pay4_enabled});
 if(body.category_images&&typeof body.category_images==='object'){const imgs=body.category_images as Record<string,unknown>;if(Object.values(imgs).some(v=>typeof v!=='string'||(v.length>0&&!/^https:\/\//.test(v))))return NextResponse.json({error:'URLs de categorias inválidas'},{status:400});rows.push({key:'category_images',value:imgs})}
 if(body.legal&&typeof body.legal==='object')rows.push({key:'legal',value:body.legal});
 if(!rows.length)return NextResponse.json({error:'Sem dados válidos'},{status:400});const {error}=await db.from('site_settings').upsert(rows);return NextResponse.json(error?{error:error.message}:{ok:true},{status:error?500:200})}
