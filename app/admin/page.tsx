import {redirect} from 'next/navigation';import {isAdmin,currentUser} from '@/lib/supabase-server';import {getSiteSettings} from '@/lib/data';import {AdminClient} from '@/components/admin-client';
export const dynamic='force-dynamic';export const metadata={title:'Administração'};
export default async function Page(){const allowed=await isAdmin();if(!allowed){const user=await currentUser();redirect(user?'/conta':'/entrar')};const settings=await getSiteSettings();return <AdminClient settings={settings}/>}
