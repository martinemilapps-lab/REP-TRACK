import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
export function InlineAlert({ tone='info', children }: { tone?: 'info'|'success'|'warning'|'error'; children: ReactNode }) { const Icon={info:Info,success:CircleCheck,warning:TriangleAlert,error:CircleAlert}[tone]; return <div role={tone === 'error' ? 'alert' : 'status'} className={`inline-alert inline-alert-${tone}`}><Icon className="size-4 shrink-0"/><div>{children}</div></div>; }
