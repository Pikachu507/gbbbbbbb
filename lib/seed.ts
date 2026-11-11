import {slug} from './format';
import type {Product} from './types';
const leagues:Record<string,string[]>={
 'Premier League':['Arsenal','Chelsea','Liverpool','Manchester United','Manchester City','Tottenham','Newcastle','Aston Villa','West Ham','Brighton','Everton','Nottingham Forest'],
 'La Liga':['Real Madrid','Barcelona','Atlético de Madrid','Sevilla','Real Betis','Athletic Club','Valencia','Villarreal'],
 'Liga Portugal':['Benfica','Sporting CP','FC Porto','SC Braga','Vitória SC','Boavista','Famalicão','Rio Ave'],
 'Serie A':['AC Milan','Inter de Milão','Juventus','Napoli','Roma','Lazio','Fiorentina','Atalanta'],
 'Bundesliga':['Bayern Munique','Borussia Dortmund','Bayer Leverkusen','RB Leipzig','Eintracht Frankfurt'],
 'Ligue 1':['PSG','Olympique Marseille','Lyon','Monaco','Lille','Nice'],
 'Eredivisie':['Ajax','PSV','Feyenoord','AZ Alkmaar'],
 'Scottish Premiership':['Celtic','Rangers','Aberdeen'],
 'Brasileirão':['Flamengo','Corinthians','Palmeiras','Santos','São Paulo','Fluminense','Grêmio','Botafogo']
};
const countries=['Portugal','Brasil','Argentina','França','Alemanha','Espanha','Inglaterra','Itália','Países Baixos','Japão','México','Marrocos','Croácia','Uruguai'];
export const sampleProducts:Product[]=[
 ...Object.entries(leagues).flatMap(([league,teams])=>teams.flatMap(team=>['Principal','Alternativa'].map(kind=>({
   id:slug(`rascunho-${team}-${kind}`),slug:slug(`${team}-${kind}-por-confirmar`),name:`${team} · ${kind} (modelo por confirmar)`,team,league,category:slug(league),kind,season:'Por confirmar',price_cents:null,sale_price_cents:null,image_urls:[],status:'draft' as const,verified:false,featured:false,description:null
 })))),
 ...countries.flatMap(team=>['Principal','Alternativa'].map(kind=>({
   id:slug(`rascunho-${team}-${kind}-selecoes`),slug:slug(`${team}-${kind}-selecao`),name:`${team} · ${kind}`,team,league:'Seleções',category:'selecoes',kind,season:'Por confirmar',price_cents:null,sale_price_cents:null,image_urls:[],status:'draft' as const,verified:false,featured:false,description:null
 }))),
 ...['Windbreakers','Kid Kits','Casacos','Fatos de Treino','Conjuntos de Treino'].map(group=>({
  id:slug(`rascunho-${group}`),slug:slug(`${group}-catalogo-por-confirmar`),name:`${group} · Catálogo por confirmar`,team:group,league:group,category:slug(group),kind:group,season:'Por confirmar',price_cents:null,sale_price_cents:null,image_urls:[],status:'draft' as const,verified:false,featured:false,description:null
 })),
 ...['Real Madrid','Barcelona','AC Milan','Manchester United','Liverpool','Brasil','Portugal','Argentina'].map(team=>({
   id:slug(`rascunho-${team}-retro`),slug:slug(`${team}-retro`),name:`${team} · Retro`,team,league:'Retro',category:'retro',kind:'Retro',season:'Por confirmar',price_cents:null,sale_price_cents:null,image_urls:[],status:'draft' as const,verified:false,featured:false,description:null
 }))
];
