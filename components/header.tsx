'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useState} from 'react';
import {Heart,Menu,Search,ShoppingBag,UserRound,Gift,X} from 'lucide-react';
import {useShop} from './shop-provider';
import {navCategories} from '@/lib/format';
export function Header({promo='LEVA 5 PAGA 4'}:{promo?:string}){
 const [mobile,setMobile]=useState(false),[search,setSearch]=useState(false),[q,setQ]=useState('');
 const {cart,favorites,setCartOpen}=useShop();
 const links=[['Início','/'],['Mais Vendidos','/loja?sort=best'],['Nova Época 26/27','/loja?season=2026%2F27'],['Saldos','/loja?sale=1'],['Ligas','/loja'],['Seleções','/loja?category=selecoes'],['Retro','/loja?category=retro'],['Kit-Criança','/loja?category=kid-kits'],['Casacos','/loja?category=casacos'],['Treino','/loja?category=fatos-de-treino']];
 return <header className="site-header">
  <div className="promo"><Gift size={19} color="#efc55d"/><div>{promo.split(/(\d+)/).map((part,i)=>/^\d+$/.test(part)?<span key={i}>{part}</span>:<span key={i} style={{color:'white'}}>{part}</span>)}</div></div>
  <div className="container header-inner">
   <button className="icon-action mobile-toggle" aria-label="Abrir menu" onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<Menu/>}</button>
   <Link href="/" className="brand"><Image className="brand-image" src="/images/logo-oficial.png" width={75} height={52} alt="Logótipo oficial Goal District"/><span className="brand-name">GoalDistrict</span></Link>
   <nav className="main-nav" aria-label="Menu principal">{links.map(([text,href])=><Link key={text} href={href}>{text}</Link>)}</nav>
   <div className="header-actions">
    <button className="icon-action" onClick={()=>setSearch(!search)} aria-label="Pesquisar"><Search size={21}/></button>
    <Link className="icon-action" href="/favoritos" aria-label="Favoritos"><Heart size={21}/>{favorites.length>0&&<span className="counter">{favorites.length}</span>}</Link>
    <Link className="icon-action" href="/conta" aria-label="A minha conta"><UserRound size={21}/></Link>
    <button className="icon-action" onClick={()=>setCartOpen(true)} aria-label="Abrir carrinho"><ShoppingBag size={22}/><span className="counter">{cart.reduce((a,c)=>a+c.quantity,0)}</span></button>
   </div>
  </div>
  {search&&<form className="container" action="/loja" style={{paddingBottom:14,display:'flex',gap:8}}><input className="field" name="q" value={q} onChange={e=>setQ(e.target.value)} placeholder="Pesquisar clube, seleção ou camisola" autoFocus/><button className="btn btn-gold" type="submit">Pesquisar</button></form>}
  {mobile&&<nav className="container mobile-nav">{[...links,...navCategories.map(([a,b])=>[a,`/loja?category=${b}`])].map(([name,path],i)=><Link href={path} key={`${name}-${i}`} onClick={()=>setMobile(false)}>{name}</Link>)}</nav>}
 </header>
}
