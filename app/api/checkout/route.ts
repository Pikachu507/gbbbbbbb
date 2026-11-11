import {NextResponse} from 'next/server';import Stripe from 'stripe';import {z} from 'zod';
import {adminDb,currentUser} from '@/lib/supabase-server';
export const runtime='nodejs';
const checkoutSchema=z.object({
 shipping:z.object({full_name:z.string().trim().min(3).max(120),email:z.email().max(255),phone:z.string().trim().min(6).max(25),street:z.string().trim().min(5).max(200),postal_code:z.string().trim().min(4).max(20),city:z.string().trim().min(2).max(100),region:z.enum(['continente','acores','madeira']),notes:z.string().max(500).optional()}),
 items:z.array(z.object({productId:z.uuid(),variantId:z.uuid(),quantity:z.number().int().min(1).max(10),personalized:z.boolean(),customName:z.string().max(18),customNumber:z.string().max(2)})).min(1).max(30),coupon:z.string().max(32).optional()
});
export async function POST(req:Request){
 const db=adminDb(),secret=process.env.STRIPE_SECRET_KEY;if(!db||!secret)return NextResponse.json({error:'A loja ainda não tem pagamento configurado. É necessário configurar Supabase, portes e Stripe.'},{status:503});
 let parsed:z.infer<typeof checkoutSchema>;
 try{parsed=checkoutSchema.parse(await req.json())}catch{return NextResponse.json({error:'Confirma os dados de entrega, os tamanhos e as personalizações.'},{status:400})}
 for(const item of parsed.items){if(item.personalized&&(!item.customName.trim()||!/^\d{1,2}$/.test(item.customNumber)||!/^[\p{L} .'-]{1,18}$/u.test(item.customName)))return NextResponse.json({error:'Personalização inválida.'},{status:400})}
 const reqOrigin=req.headers.get('origin');if(reqOrigin&&reqOrigin!==new URL(req.url).origin)return NextResponse.json({error:'Origem não autorizada'},{status:403});
 const user=await currentUser();const address=parsed.shipping;
 const {data:result,error}=await db.rpc('create_order_and_reserve',{
  p_user_id:user?.id||null,p_email:address.email,p_shipping:address,p_region:address.region,p_items:parsed.items,p_coupon:parsed.coupon||null
 });
 if(error)return NextResponse.json({error:mapError(error.message)},{status:409});
 const order=result as {orderId:string;number:string;total:number};
 try{
  const stripe=new Stripe(secret);
  const site=process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,'')||new URL(req.url).origin;
  const session=await stripe.checkout.sessions.create({mode:'payment',locale:'pt',customer_email:address.email,
   client_reference_id:order.orderId,metadata:{order_id:order.orderId,number:order.number},payment_intent_data:{metadata:{order_id:order.orderId}},
   line_items:[{price_data:{currency:'eur',unit_amount:order.total,product_data:{name:`Encomenda ${order.number} · Goal District`,description:'Camisolas, eventuais personalizações, portes e descontos incluídos'}},quantity:1}],
   success_url:`${site}/obrigado?session_id={CHECKOUT_SESSION_ID}`,
   cancel_url:`${site}/carrinho?checkout=cancelado`,expires_at:Math.floor(Date.now()/1000)+1800
  },{idempotencyKey:`checkout-${order.orderId}`});
  const {error:saveError}=await db.from('orders').update({stripe_session_id:session.id}).eq('id',order.orderId);
  if(saveError)throw saveError;
  return NextResponse.json({url:session.url});
 }catch(err){await db.rpc('finalize_order',{p_id:order.orderId,p_action:'cancelled'});console.error('checkout Stripe:',err);return NextResponse.json({error:'Não foi possível iniciar o pagamento. Tenta novamente mais tarde.'},{status:502})}
}
function mapError(message:string){if(/Shipping fees not configured/i.test(message))return 'Os portes ainda não foram configurados pelo administrador.';
if(/stock|unavailable/i.test(message))return 'Uma camisola está esgotada ou indisponível. Atualiza o carrinho.';
if(/coupon/i.test(message))return 'Cupão inválido ou não aplicável.';
return 'Não foi possível criar a encomenda: '+message.replace(/[<>]/g,'').slice(0,140);}
