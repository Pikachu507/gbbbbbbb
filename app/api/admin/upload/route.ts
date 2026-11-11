import {NextResponse} from 'next/server';import {adminDb,isAdmin} from '@/lib/supabase-server';import {randomUUID} from 'crypto';
export const runtime='nodejs';
export async function POST(req:Request){if(!await isAdmin())return NextResponse.json({error:'Sem permissão'},{status:403});const db=adminDb();if(!db)return NextResponse.json({error:'Supabase indisponível'},{status:503});
 const data=await req.formData(),file=data.get('file');if(!(file instanceof File))return NextResponse.json({error:'Ficheiro em falta'},{status:400});
 const mimes=['image/jpeg','image/png','image/webp'];if(!mimes.includes(file.type)||file.size>10*1024*1024||file.size<100)return NextResponse.json({error:'Apenas JPEG, PNG ou WEBP até 10 MB.'},{status:400});
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];const path=`catalogo/${randomUUID()}.${ext}`;
 const {error}=await db.storage.from('product-images').upload(path,Buffer.from(await file.arrayBuffer()),{contentType:file.type,upsert:false});
 if(error)return NextResponse.json({error:error.message},{status:500});const {data:publicData}=db.storage.from('product-images').getPublicUrl(path);return NextResponse.json({url:publicData.publicUrl});}
