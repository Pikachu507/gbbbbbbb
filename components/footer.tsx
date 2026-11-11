import Link from 'next/link';import Image from 'next/image';
export function Footer(){const cols=[
  ['Apoio',['Contactos','contactos'],['Como encomendar','como-encomendar'],['Guia de tamanhos','guia-de-tamanhos'],['Perguntas frequentes','perguntas-frequentes']],
  ['Informações',['Envios','envios'],['Trocas e devoluções','devolucoes'],['Acompanhar encomenda','acompanhar'],['Sobre nós','sobre']],
  ['Legal',['Termos e condições','termos'],['Privacidade','privacidade'],['Cookies','cookies']]
 ] as const;return <footer className="footer"><div className="container"><div className="footer-grid"><div>
  <Link href="/" style={{display:'flex',alignItems:'center',gap:12}}><Image src="/images/logo-oficial.png" width={74} height={68} alt="Goal District"/><strong style={{fontSize:22,color:'white'}}>GOAL DISTRICT</strong></Link>
  <p style={{fontSize:13,color:'#aaa',maxWidth:300,lineHeight:1.8}}>Camisolas, clássicos e cultura futebolística. Portugal Continental e Ilhas.</p>
 </div>{cols.map(([title,...items])=><div key={title}><strong>{title}</strong>{items.map(([label,slug])=><Link href={`/info/${slug}`} key={slug}>{label}</Link>)}</div>)}</div><div className="divider" style={{borderColor:'#333'}}/><small>© {new Date().getFullYear()} Goal District. Imagens e marcas pertencem aos respetivos titulares. Informações comerciais sujeitas a confirmação.</small></div></footer>}
