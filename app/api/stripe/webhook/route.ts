import {NextResponse} from 'next/server';import Stripe from 'stripe';import {adminDb} from '@/lib/supabase-server';import {sendOrderEmail} from '@/lib/mail';
export const runtime='nodejs';
export async function POST(req:Request){const secret=process.env.STRIPE_SECRET_KEY,webhook=process.env.STRIPE_WEBHOOK_SECRET,db=adminDb();if(!secret||!webhook||!db)return NextResponse.json({error:'Not configured'},{status:503});
 const signature=req.headers.get('stripe-signature');if(!signature)return NextResponse.json({error:'Missing signature'},{status:400});
 let event:Stripe.Event;try{const raw=await req.text();event=new Stripe(secret).webhooks.constructEvent(raw,signature,webhook)}catch{return NextResponse.json({error:'Invalid signature'},{status:400})}
 if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)){
   const session=event.data.object as Stripe.Checkout.Session;
   const id=session.metadata?.order_id;
   if(id){
    // Paid only when Stripe has attested settlement, never from the redirect URL.
    let action:null|'paid'|'failed'|'cancelled'=null;
    if(event.type==='checkout.session.async_payment_succeeded'||(event.type==='checkout.session.completed'&&session.payment_status==='paid'))action='paid';
    if(event.type==='checkout.session.async_payment_failed')action='failed';
    if(event.type==='checkout.session.expired')action='cancelled';
    if(action){const {data:changed,error}=await db.rpc('finalize_order',{p_id:id,p_action:action});if(error){console.error('Webhook DB:',error);return NextResponse.json({error:'Database update failed'},{status:500})}if(changed&&action==='paid'){const {data:order}=await db.from('orders').select('email,public_number').eq('id',id).single();if(order)await sendOrderEmail(order.email,order.public_number,'paid')}}
   }
 }
 if(event.type==='charge.refunded'){const charge=event.data.object as Stripe.Charge;if(charge.refunded&&charge.payment_intent){const pi=await new Stripe(secret).paymentIntents.retrieve(String(charge.payment_intent));const id=pi.metadata?.order_id;if(id){const {error}=await db.rpc('finalize_order',{p_id:id,p_action:'refunded'});if(error)return NextResponse.json({error:'Refund sync failed'},{status:500})}}}
 return NextResponse.json({received:true});}
