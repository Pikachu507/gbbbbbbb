'use client';
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import {browserDb} from '@/lib/supabase';
import {itemKey} from '@/lib/format';
import type {CartItem,Product,Variant} from '@/lib/types';

type Store={cart:CartItem[];favorites:string[];cartOpen:boolean;setCartOpen:(v:boolean)=>void;add:(p:Product,v:Variant,qty:number,name:string,num:string,personalized:boolean)=>void;change:(key:string,quantity:number)=>void;remove:(key:string)=>void;clear:()=>void;toggleFavorite:(productId:string)=>Promise<void>};
const Ctx=createContext<Store|null>(null);
export function ShopProvider({children}:{children:React.ReactNode}){
 const [cart,setCart]=useState<CartItem[]>([]),[favorites,setFavorites]=useState<string[]>([]),[cartOpen,setCartOpen]=useState(false),[ready,setReady]=useState(false);
 useEffect(()=>{try{setCart(JSON.parse(localStorage.getItem('gd_cart')||'[]'));setFavorites(JSON.parse(localStorage.getItem('gd_favs')||'[]'))}catch{}setReady(true)},[]);
 useEffect(()=>{if(ready)localStorage.setItem('gd_cart',JSON.stringify(cart))},[cart,ready]);
 useEffect(()=>{if(ready)localStorage.setItem('gd_favs',JSON.stringify(favorites))},[favorites,ready]);
 useEffect(()=>{
  const db=browserDb();if(!db||!ready)return;
  let live=true;
  const sync=async()=>{
   const {data:{user}}=await db.auth.getUser();if(!user||!live)return;
   const {data}=await db.from('favorites').select('product_id').eq('user_id',user.id);
   if(data){const remote=data.map(x=>x.product_id);const merged=[...new Set([...remote,...favorites.filter(id=>/^[0-9a-f-]{36}$/.test(id))])];setFavorites(merged);
     const missing=merged.filter(x=>!remote.includes(x)).map(x=>({product_id:x,user_id:user.id}));if(missing.length)await db.from('favorites').upsert(missing,{onConflict:'user_id,product_id'});
   }
   // Reconcile server cart only on login; client cart remains authoritative during browsing.
  };sync();const {data:sub}=db.auth.onAuthStateChange(()=>{void sync()});
  return()=>{live=false;sub.subscription.unsubscribe()};
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[ready]);
 const add=useCallback((p:Product,v:Variant,qty:number,name:string,num:string,personalized:boolean)=>{
  const key=itemKey(v.id,v.size,personalized,name,num);setCart(old=>{
   const existing=old.find(i=>i.key===key);if(existing)return old.map(i=>i.key===key?{...i,quantity:Math.min(v.stock,i.quantity+qty)}:i);
   return [...old,{key,productId:p.id,variantId:v.id,slug:p.slug,name:p.name,image:p.image_urls[0],size:v.size,unitPrice:p.sale_price_cents??p.price_cents??0,quantity:qty,personalized,customName:personalized?name.trim().toUpperCase():'',customNumber:personalized?num.trim():''}]
  });setCartOpen(true);
 },[]);
 const change=useCallback((key:string,quantity:number)=>setCart(old=>old.map(i=>i.key===key?{...i,quantity:Math.max(1,Math.min(10,quantity))}:i)),[]);
 const remove=useCallback((key:string)=>setCart(old=>old.filter(i=>i.key!==key)),[]);
 const clear=useCallback(()=>setCart([]),[]);
 const toggleFavorite=async(id:string)=>{
  const exists=favorites.includes(id);setFavorites(old=>exists?old.filter(x=>x!==id):[...old,id]);
  const db=browserDb();if(!db)return;const {data:{user}}=await db.auth.getUser();if(!user)return;
  if(exists)await db.from('favorites').delete().eq('user_id',user.id).eq('product_id',id);
  else if(/^[0-9a-f-]{36}$/.test(id))await db.from('favorites').upsert({user_id:user.id,product_id:id});
 };
 return <Ctx.Provider value={{cart,favorites,cartOpen,setCartOpen,add,change,remove,clear,toggleFavorite}}>{children}</Ctx.Provider>;
}
export function useShop(){const c=useContext(Ctx);if(!c)throw new Error('ShopProvider ausente');return c}
