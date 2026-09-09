import { redirect } from 'next/navigation';

export default function AdminLayout() {
  redirect('/?view=admin');
}
