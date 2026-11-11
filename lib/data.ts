import {configured} from './supabase';
import {adminDb} from './supabase-server';
import {sampleProducts} from './seed';
import type {Product} from './types';
export async function getProducts(opts:{category?:string;search?:string;sort?:string;includeDraft?:boolean;limit?:number}={}):Promise<Product[]>{
 const db=adminDb();if(!configured()||!db){let arr=sampleProducts;
  if(opts.category)arr=arr.filter(x=>x.category===opts.category||x.league.toLowerCase()===opts.category);
  if(opts.search)arr=arr.filter(x=>(x.name+' '+x.league).toLowerCase().includes(opts.search!.toLowerCase()));
  return arr.slice(0,opts.limit??200);
 }
 let q=db.from('products').select('*,variants:product_variants(*)').order('created_at',{ascending:false}).limit(opts.limit??300);
 if(!opts.includeDraft)q=q.eq('status','published').eq('verified',true);
 if(opts.category)q=q.eq('category',opts.category);
 if(opts.search)q=q.or(`name.ilike.%${opts.search.replace(/[,()%]/g,'')}%,team.ilike.%${opts.search.replace(/[,()%]/g,'')}%`);
 const {data,error}=await q;if(error){console.error('products:',error.message);return []}
 let ps=(data||[]) as Product[];
 if(opts.sort==='asc')ps.sort((a,b)=>(a.sale_price_cents??a.price_cents??Infinity)-(b.sale_price_cents??b.price_cents??Infinity));
 if(opts.sort==='desc')ps.sort((a,b)=>(b.sale_price_cents??b.price_cents??-1)-(a.sale_price_cents??a.price_cents??-1));
 if(opts.sort==='az')ps.sort((a,b)=>a.name.localeCompare(b.name,'pt'));
 return ps;
}
export async function getProduct(slug:string):Promise<Product|null>{
 const db=adminDb();if(!configured()||!db)return sampleProducts.find(p=>p.slug===slug)||null;
 const {data}=await db.from('products').select('*, variants:product_variants(*)').eq('slug',slug).eq('status','published').eq('verified',true).maybeSingle();return (data as Product)||null;
}
export async function getSiteSettings():Promise<Record<string,unknown>>{
 const db=adminDb();if(!db)return {};
 const {data}=await db.from('site_settings').select('key,value');
 return Object.fromEntries((data||[]).map(x=>[x.key,x.value]));
}
export async function getBanners(){const db=adminDb();if(!db)return [] as {id:string;title:string;subtitle:string;image_url:string|null;button_text:string;button_url:string;position:number}[];const {data}=await db.from('banners').select('*').eq('active',true).order('position').limit(5);return data||[];}
/** Only purchases whose payment is confirmed contribute to bestsellers. */
export async function getSalesCounts():Promise<Record<string,number>>{
 const db=adminDb();if(!db)return {};
 const {data,error}=await db.from('order_items').select('product_id,quantity,orders!inner(payment_status)').eq('orders.payment_status','paid').limit(5000);
 if(error){console.error('sales ranking:',error.message);return {}}
 const result:Record<string,number>={};for(const line of data||[]){if(line.product_id)result[line.product_id]=(result[line.product_id]||0)+line.quantity};return result;
}
