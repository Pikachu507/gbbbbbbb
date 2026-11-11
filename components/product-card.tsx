'use client';import Link from 'next/link';import Image from 'next/image';import {Heart,Shirt} from 'lucide-react';import {eur} from '@/lib/format';import {useShop} from './shop-provider';import type {Product} from '@/lib/types';
export function ProductCard({p}:{p:Product}){const {favorites,toggleFavorite}=useShop();const ready=p.status==='published'&&p.verified&&p.price_cents!==null&&p.image_urls.length>0;
 return <article className="product-card"><div className="prod-photo">
  <span className={`tag ${!ready?'tag-pending':''}`}>{ready?'Novo':'Em validação'}</span>
  {ready&&<button className="fav-btn" aria-label="Alternar favorito" onClick={()=>void toggleFavorite(p.id)}><Heart size={19} fill={favorites.includes(p.id)?'#d02335':'none'} color={favorites.includes(p.id)?'#d02335':'#111'}/></button>}
  {ready?<Link href={`/produto/${p.slug}`} style={{height:'100%',width:'100%'}}><Image src={p.image_urls[0]} alt={p.name} width={380} height={460} unoptimized/></Link>:<div className="pending-art"><Shirt size={62} strokeWidth={1}/><strong>{p.team}</strong><small>Fotografia por confirmar</small></div>}
 </div><div className="prod-body"><div className="prod-name">{ready?<Link href={`/produto/${p.slug}`}>{p.name}</Link>:p.name}</div><div className="prod-sub">{p.league} · {p.kind}</div><div className="prod-price">{ready?eur(p.sale_price_cents??p.price_cents??0):<span className="muted" style={{fontWeight:500,fontSize:13}}>Preço por confirmar</span>}</div>{ready&&<Link href={`/produto/${p.slug}`} style={{fontSize:12,textDecoration:'underline'}}>Ver detalhes</Link>}</div></article>
}
